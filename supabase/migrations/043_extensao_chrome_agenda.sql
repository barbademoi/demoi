-- EXTENSÃO CHROME DO AGENDA SERVIÇO
--
-- A extensão envia apenas o relatório obtido com a sessão já aberta no
-- navegador. O endpoint valida um token privado e chama esta função com a
-- service role. A função fixa o destino na conta autorizada, resolve somente
-- de-paras já confirmados e delega a gravação à mesma RPC usada pelo PDF.

alter table public.importacao_agenda_fotos
  add column if not exists servicos_acumulado numeric(14,2)
    check (servicos_acumulado is null or servicos_acumulado >= 0),
  add column if not exists produtos_acumulado numeric(14,2)
    check (produtos_acumulado is null or produtos_acumulado >= 0),
  add column if not exists assinaturas_acumulado numeric(14,2)
    check (assinaturas_acumulado is null or assinaturas_acumulado >= 0);

alter table public.importacao_agenda_lotes
  add column if not exists origem text not null default 'pdf'
    check (origem in ('pdf', 'extensao_chrome'));

create or replace function public.confirmar_importacao_agenda_extensao(
  p_arquivo_nome text,
  p_arquivo_hash text,
  p_periodo_inicio date,
  p_data_relatorio date,
  p_itens jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_usuario_id uuid;
  v_barbearia_id uuid;
  v_claims_anteriores text;
  v_itens_mapeados jsonb := '[]'::jsonb;
  v_item jsonb;
  v_nome text;
  v_nome_chave text;
  v_barbeiro_id uuid;
  v_servicos numeric(14,2);
  v_produtos numeric(14,2);
  v_assinaturas numeric(14,2);
  v_faturamento numeric(14,2);
  v_comissao numeric(14,2);
  v_ausentes text[] := array[]::text[];
  v_resultado jsonb;
  v_lote_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Acesso não autorizado para a extensão.';
  end if;

  select au.id, u.barbearia_id
  into v_usuario_id, v_barbearia_id
  from auth.users au
  join public.usuarios u on u.id = au.id
  where lower(au.email) = 'barbeariademoi@gmail.com'
  limit 1;

  if v_usuario_id is null or v_barbearia_id is null then
    raise exception 'Conta autorizada da extensão não encontrada.';
  end if;
  if jsonb_typeof(p_itens) <> 'array'
     or jsonb_array_length(p_itens) = 0
     or jsonb_array_length(p_itens) > 100 then
    raise exception 'A lista de profissionais da extensão é inválida.';
  end if;

  for v_item in select value from jsonb_array_elements(p_itens)
  loop
    begin
      v_nome := trim(v_item ->> 'nomeRelatorio');
      v_servicos := round((v_item ->> 'servicosAcumulado')::numeric, 2);
      v_produtos := round((v_item ->> 'produtosAcumulado')::numeric, 2);
      v_assinaturas := round((v_item ->> 'assinaturasAcumulado')::numeric, 2);
      v_faturamento := round((v_item ->> 'faturamentoAcumulado')::numeric, 2);
      v_comissao := round((v_item ->> 'comissaoAcumulada')::numeric, 2);
    exception when others then
      raise exception 'Há dados inválidos no relatório enviado pela extensão.';
    end;

    if v_nome is null or length(v_nome) = 0
       or v_servicos < 0
       or v_produtos < 0
       or v_assinaturas < 0
       or v_faturamento < 0
       or v_comissao < 0 then
      raise exception 'Há nomes ou valores inválidos no relatório enviado pela extensão.';
    end if;
    if abs(round(v_servicos + v_produtos + v_assinaturas, 2) - v_faturamento) > 0.05 then
      raise exception
        'O faturamento de % não confere com serviços + produtos + assinaturas.',
        v_nome;
    end if;

    v_nome_chave := lower(regexp_replace(v_nome, '[[:space:]]+', ' ', 'g'));
    select m.barbeiro_id
    into v_barbeiro_id
    from public.importacao_agenda_mapeamentos m
    join public.barbeiros b
      on b.id = m.barbeiro_id
     and b.barbearia_id = v_barbearia_id
     and b.ativo = true
     and coalesce(b.tipo, 'barbeiro') <> 'recepcionista'
    where m.barbearia_id = v_barbearia_id
      and m.nome_relatorio_chave = v_nome_chave;

    if v_barbeiro_id is null then
      v_ausentes := array_append(v_ausentes, v_nome);
    else
      v_itens_mapeados := v_itens_mapeados || jsonb_build_array(
        jsonb_build_object(
          'nomeRelatorio', v_nome,
          'barbeiroId', v_barbeiro_id,
          'faturamentoAcumulado', v_faturamento,
          'comissaoAcumulada', v_comissao
        )
      );
    end if;
  end loop;

  if cardinality(v_ausentes) > 0 then
    raise exception 'MAPEAMENTO_AUSENTE:%', array_to_string(v_ausentes, ', ');
  end if;

  v_claims_anteriores := current_setting('request.jwt.claims', true);
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', v_usuario_id,
      'email', 'barbeariademoi@gmail.com',
      'role', 'authenticated'
    )::text,
    true
  );

  -- Fonte única de verdade: foto, diferença diária, modo de meta, ranking,
  -- acumulados e faturamento coletivo continuam na RPC usada pelo PDF.
  v_resultado := public.confirmar_importacao_agenda(
    p_arquivo_nome,
    p_arquivo_hash,
    p_periodo_inicio,
    p_data_relatorio,
    v_itens_mapeados
  );
  v_lote_id := (v_resultado ->> 'loteId')::uuid;

  for v_item in select value from jsonb_array_elements(p_itens)
  loop
    v_nome := trim(v_item ->> 'nomeRelatorio');
    v_nome_chave := lower(regexp_replace(v_nome, '[[:space:]]+', ' ', 'g'));
    select m.barbeiro_id
    into v_barbeiro_id
    from public.importacao_agenda_mapeamentos m
    where m.barbearia_id = v_barbearia_id
      and m.nome_relatorio_chave = v_nome_chave;

    update public.importacao_agenda_fotos
    set
      servicos_acumulado =
        round((v_item ->> 'servicosAcumulado')::numeric, 2),
      produtos_acumulado =
        round((v_item ->> 'produtosAcumulado')::numeric, 2),
      assinaturas_acumulado =
        round((v_item ->> 'assinaturasAcumulado')::numeric, 2),
      atualizado_em = now()
    where barbearia_id = v_barbearia_id
      and barbeiro_id = v_barbeiro_id
      and data_relatorio = p_data_relatorio
      and lote_id = v_lote_id;
  end loop;

  update public.importacao_agenda_lotes
  set
    origem = 'extensao_chrome',
    resumo = resumo || jsonb_build_object(
      'servicosAcumulado',
      (
        select round(sum((item ->> 'servicosAcumulado')::numeric), 2)
        from jsonb_array_elements(p_itens) item
      ),
      'produtosAcumulado',
      (
        select round(sum((item ->> 'produtosAcumulado')::numeric), 2)
        from jsonb_array_elements(p_itens) item
      ),
      'assinaturasAcumulado',
      (
        select round(sum((item ->> 'assinaturasAcumulado')::numeric), 2)
        from jsonb_array_elements(p_itens) item
      )
    )
  where id = v_lote_id;

  perform set_config(
    'request.jwt.claims',
    coalesce(v_claims_anteriores, '{}'),
    true
  );

  return v_resultado || jsonb_build_object(
    'origem', 'extensao_chrome',
    'categoriasArmazenadas', true
  );
end;
$$;

revoke all on function public.confirmar_importacao_agenda_extensao(
  text,
  text,
  date,
  date,
  jsonb
) from public, anon, authenticated;
grant execute on function public.confirmar_importacao_agenda_extensao(
  text,
  text,
  date,
  date,
  jsonb
) to service_role;

comment on function public.confirmar_importacao_agenda_extensao(
  text,
  text,
  date,
  date,
  jsonb
) is
  'Entrada privada da extensão Chrome; fixa a conta autorizada, exige de-para salvo e reutiliza a confirmação do PDF.';
