-- IMPORTAÇÃO DIÁRIA DO AGENDA SERVIÇO
--
-- Guarda a foto acumulada das duas trilhas (faturamento e comissão), o
-- de-para dos nomes e a auditoria dos lotes confirmados. A função de
-- confirmação é transacional: ou foto + movimento + acumulado são atualizados
-- juntos, ou nada é gravado.

create table if not exists public.importacao_agenda_mapeamentos (
  id                    uuid primary key default gen_random_uuid(),
  barbearia_id          uuid not null references public.barbearias(id) on delete cascade,
  nome_relatorio        text not null,
  nome_relatorio_chave  text not null,
  barbeiro_id           uuid not null references public.barbeiros(id) on delete cascade,
  criado_por            uuid not null references auth.users(id) on delete cascade,
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now(),
  unique (barbearia_id, nome_relatorio_chave)
);

create index if not exists idx_agenda_mapeamentos_barbeiro
  on public.importacao_agenda_mapeamentos (barbearia_id, barbeiro_id);

create table if not exists public.importacao_agenda_lotes (
  id                       uuid primary key default gen_random_uuid(),
  barbearia_id             uuid not null references public.barbearias(id) on delete cascade,
  usuario_id               uuid not null references auth.users(id) on delete cascade,
  arquivo_nome             text not null,
  arquivo_hash             text not null,
  periodo_inicio           date not null,
  data_relatorio           date not null,
  quantidade_profissionais integer not null,
  reimportacao             boolean not null default false,
  resumo                   jsonb not null default '{}'::jsonb,
  confirmado_em            timestamptz not null default now()
);

create index if not exists idx_agenda_lotes_barbearia_data
  on public.importacao_agenda_lotes (barbearia_id, data_relatorio desc, confirmado_em desc);

create table if not exists public.importacao_agenda_fotos (
  id                       uuid primary key default gen_random_uuid(),
  barbearia_id             uuid not null references public.barbearias(id) on delete cascade,
  barbeiro_id              uuid not null references public.barbeiros(id) on delete cascade,
  data_relatorio           date not null,
  periodo_inicio           date not null,
  faturamento_acumulado    numeric(14,2) not null check (faturamento_acumulado >= 0),
  comissao_acumulada       numeric(14,2) not null check (comissao_acumulada >= 0),
  movimento_faturamento    numeric(14,2) not null default 0,
  movimento_comissao       numeric(14,2) not null default 0,
  lote_id                  uuid not null references public.importacao_agenda_lotes(id) on delete restrict,
  criado_em                timestamptz not null default now(),
  atualizado_em            timestamptz not null default now(),
  unique (barbearia_id, barbeiro_id, data_relatorio)
);

create index if not exists idx_agenda_fotos_anterior
  on public.importacao_agenda_fotos (barbearia_id, barbeiro_id, data_relatorio desc);

alter table public.importacao_agenda_mapeamentos enable row level security;
alter table public.importacao_agenda_lotes enable row level security;
alter table public.importacao_agenda_fotos enable row level security;

drop policy if exists "dono_teste_acessa_agenda_mapeamentos" on public.importacao_agenda_mapeamentos;
create policy "dono_teste_acessa_agenda_mapeamentos"
  on public.importacao_agenda_mapeamentos
  for all
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'barbeariademoi@gmail.com'
    and barbearia_id in (
      select u.barbearia_id from public.usuarios u where u.id = auth.uid()
    )
  )
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'barbeariademoi@gmail.com'
    and barbearia_id in (
      select u.barbearia_id from public.usuarios u where u.id = auth.uid()
    )
  );

drop policy if exists "dono_teste_acessa_agenda_lotes" on public.importacao_agenda_lotes;
create policy "dono_teste_acessa_agenda_lotes"
  on public.importacao_agenda_lotes
  for all
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'barbeariademoi@gmail.com'
    and usuario_id = auth.uid()
    and barbearia_id in (
      select u.barbearia_id from public.usuarios u where u.id = auth.uid()
    )
  )
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'barbeariademoi@gmail.com'
    and usuario_id = auth.uid()
    and barbearia_id in (
      select u.barbearia_id from public.usuarios u where u.id = auth.uid()
    )
  );

drop policy if exists "dono_teste_acessa_agenda_fotos" on public.importacao_agenda_fotos;
create policy "dono_teste_acessa_agenda_fotos"
  on public.importacao_agenda_fotos
  for all
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'barbeariademoi@gmail.com'
    and barbearia_id in (
      select u.barbearia_id from public.usuarios u where u.id = auth.uid()
    )
  )
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'barbeariademoi@gmail.com'
    and barbearia_id in (
      select u.barbearia_id from public.usuarios u where u.id = auth.uid()
    )
  );

create or replace function public.confirmar_importacao_agenda(
  p_arquivo_nome text,
  p_arquivo_hash text,
  p_periodo_inicio date,
  p_data_relatorio date,
  p_itens jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_barbearia_id uuid;
  v_dia_fechamento integer;
  v_modo_meta text;
  v_base_meta text;
  v_lote_id uuid;
  v_reimportacao boolean;
  v_item jsonb;
  v_barbeiro_id uuid;
  v_nome text;
  v_nome_chave text;
  v_faturamento numeric(14,2);
  v_comissao numeric(14,2);
  v_proxima_data date;
  v_afetado record;
  v_foto record;
  v_anterior_faturamento numeric(14,2);
  v_anterior_comissao numeric(14,2);
  v_inicio_ciclo date;
  v_fim_ciclo date;
  v_mes integer;
  v_ano integer;
  v_total_faturamento numeric(14,2);
  v_total_comissao numeric(14,2);
  v_total_base numeric(14,2);
  v_bc record;
begin
  if v_usuario_id is null then
    raise exception 'Não autenticado.';
  end if;
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> 'barbeariademoi@gmail.com' then
    raise exception 'Sem acesso à importação em teste.';
  end if;

  select
    u.barbearia_id,
    greatest(1, least(28, coalesce(b.dia_fechamento, 1))),
    coalesce(b.modo_meta, 'comissao'),
    case
      when coalesce(b.modo_meta, 'comissao') = 'faturamento' then 'faturamento'
      when coalesce(b.modo_meta, 'comissao') = 'comissao' then 'comissao'
      else coalesce(b.base_meta, 'comissao')
    end
  into v_barbearia_id, v_dia_fechamento, v_modo_meta, v_base_meta
  from public.usuarios u
  join public.barbearias b on b.id = u.barbearia_id
  where u.id = v_usuario_id;

  if v_barbearia_id is null then
    raise exception 'Barbearia não encontrada.';
  end if;
  if p_periodo_inicio is null or p_data_relatorio is null
     or extract(day from p_periodo_inicio) <> 1
     or date_trunc('month', p_periodo_inicio) <> date_trunc('month', p_data_relatorio)
     or p_periodo_inicio > p_data_relatorio then
    raise exception 'O período do relatório é inválido.';
  end if;
  if p_arquivo_nome is null or length(trim(p_arquivo_nome)) = 0
     or p_arquivo_hash is null
     or p_arquivo_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'O arquivo da importação é inválido.';
  end if;
  if jsonb_typeof(p_itens) <> 'array'
     or jsonb_array_length(p_itens) = 0
     or jsonb_array_length(p_itens) > 100 then
    raise exception 'A lista de profissionais é inválida.';
  end if;
  if (
    select count(*) <> count(distinct item ->> 'barbeiroId')
    from jsonb_array_elements(p_itens) item
  ) then
    raise exception 'Cada profissional do BarberMeta só pode ser usado uma vez no de-para.';
  end if;

  select exists (
    select 1
    from public.importacao_agenda_fotos f
    where f.barbearia_id = v_barbearia_id
      and f.data_relatorio = p_data_relatorio
  ) into v_reimportacao;

  insert into public.importacao_agenda_lotes (
    barbearia_id,
    usuario_id,
    arquivo_nome,
    arquivo_hash,
    periodo_inicio,
    data_relatorio,
    quantidade_profissionais,
    reimportacao
  ) values (
    v_barbearia_id,
    v_usuario_id,
    left(trim(p_arquivo_nome), 255),
    lower(p_arquivo_hash),
    p_periodo_inicio,
    p_data_relatorio,
    jsonb_array_length(p_itens),
    v_reimportacao
  )
  returning id into v_lote_id;

  create temporary table if not exists importacao_agenda_afetados (
    barbeiro_id uuid not null,
    data_relatorio date not null,
    primary key (barbeiro_id, data_relatorio)
  ) on commit drop;
  create temporary table if not exists importacao_agenda_barbeiro_ciclos (
    barbeiro_id uuid not null,
    inicio_ciclo date not null,
    fim_ciclo date not null,
    mes integer not null,
    ano integer not null,
    primary key (barbeiro_id, mes, ano)
  ) on commit drop;
  create temporary table if not exists importacao_agenda_ciclos (
    mes integer not null,
    ano integer not null,
    primary key (mes, ano)
  ) on commit drop;

  truncate pg_temp.importacao_agenda_afetados;
  truncate pg_temp.importacao_agenda_barbeiro_ciclos;
  truncate pg_temp.importacao_agenda_ciclos;

  for v_item in select value from jsonb_array_elements(p_itens)
  loop
    begin
      v_barbeiro_id := (v_item ->> 'barbeiroId')::uuid;
      v_nome := trim(v_item ->> 'nomeRelatorio');
      v_faturamento := round((v_item ->> 'faturamentoAcumulado')::numeric, 2);
      v_comissao := round((v_item ->> 'comissaoAcumulada')::numeric, 2);
    exception when others then
      raise exception 'Há dados inválidos na confirmação.';
    end;

    if v_nome is null or length(v_nome) = 0
       or v_faturamento < 0 or v_comissao < 0 then
      raise exception 'Há nomes ou valores inválidos na confirmação.';
    end if;
    if not exists (
      select 1
      from public.barbeiros b
      where b.id = v_barbeiro_id
        and b.barbearia_id = v_barbearia_id
        and b.ativo = true
        and coalesce(b.tipo, 'barbeiro') <> 'recepcionista'
    ) then
      raise exception 'Um dos barbeiros não pertence à barbearia ou está inativo.';
    end if;

    v_nome_chave := lower(regexp_replace(v_nome, '[[:space:]]+', ' ', 'g'));
    insert into public.importacao_agenda_mapeamentos (
      barbearia_id,
      nome_relatorio,
      nome_relatorio_chave,
      barbeiro_id,
      criado_por,
      atualizado_em
    ) values (
      v_barbearia_id,
      v_nome,
      v_nome_chave,
      v_barbeiro_id,
      v_usuario_id,
      now()
    )
    on conflict (barbearia_id, nome_relatorio_chave)
    do update set
      nome_relatorio = excluded.nome_relatorio,
      barbeiro_id = excluded.barbeiro_id,
      atualizado_em = now();

    insert into public.importacao_agenda_fotos (
      barbearia_id,
      barbeiro_id,
      data_relatorio,
      periodo_inicio,
      faturamento_acumulado,
      comissao_acumulada,
      lote_id,
      atualizado_em
    ) values (
      v_barbearia_id,
      v_barbeiro_id,
      p_data_relatorio,
      p_periodo_inicio,
      v_faturamento,
      v_comissao,
      v_lote_id,
      now()
    )
    on conflict (barbearia_id, barbeiro_id, data_relatorio)
    do update set
      periodo_inicio = excluded.periodo_inicio,
      faturamento_acumulado = excluded.faturamento_acumulado,
      comissao_acumulada = excluded.comissao_acumulada,
      lote_id = excluded.lote_id,
      atualizado_em = now();

    insert into pg_temp.importacao_agenda_afetados (barbeiro_id, data_relatorio)
    values (v_barbeiro_id, p_data_relatorio)
    on conflict do nothing;

    select min(f.data_relatorio)
    into v_proxima_data
    from public.importacao_agenda_fotos f
    where f.barbearia_id = v_barbearia_id
      and f.barbeiro_id = v_barbeiro_id
      and f.data_relatorio > p_data_relatorio
      and date_trunc('month', f.data_relatorio) = date_trunc('month', p_data_relatorio);

    if v_proxima_data is not null then
      insert into pg_temp.importacao_agenda_afetados (barbeiro_id, data_relatorio)
      values (v_barbeiro_id, v_proxima_data)
      on conflict do nothing;
    end if;
  end loop;

  for v_afetado in
    select barbeiro_id, data_relatorio
    from pg_temp.importacao_agenda_afetados
    order by data_relatorio, barbeiro_id
  loop
    select
      f.faturamento_acumulado,
      f.comissao_acumulada
    into strict v_foto
    from public.importacao_agenda_fotos f
    where f.barbearia_id = v_barbearia_id
      and f.barbeiro_id = v_afetado.barbeiro_id
      and f.data_relatorio = v_afetado.data_relatorio;

    v_anterior_faturamento := null;
    v_anterior_comissao := null;
    select
      f.faturamento_acumulado,
      f.comissao_acumulada
    into v_anterior_faturamento, v_anterior_comissao
    from public.importacao_agenda_fotos f
    where f.barbearia_id = v_barbearia_id
      and f.barbeiro_id = v_afetado.barbeiro_id
      and f.data_relatorio < v_afetado.data_relatorio
      and date_trunc('month', f.data_relatorio) = date_trunc('month', v_afetado.data_relatorio)
    order by f.data_relatorio desc
    limit 1;

    v_faturamento := round(
      v_foto.faturamento_acumulado - coalesce(v_anterior_faturamento, 0),
      2
    );
    v_comissao := round(
      v_foto.comissao_acumulada - coalesce(v_anterior_comissao, 0),
      2
    );

    update public.importacao_agenda_fotos
    set
      movimento_faturamento = v_faturamento,
      movimento_comissao = v_comissao,
      atualizado_em = now()
    where barbearia_id = v_barbearia_id
      and barbeiro_id = v_afetado.barbeiro_id
      and data_relatorio = v_afetado.data_relatorio;

    if extract(day from v_afetado.data_relatorio)::integer >= v_dia_fechamento then
      v_inicio_ciclo := make_date(
        extract(year from v_afetado.data_relatorio)::integer,
        extract(month from v_afetado.data_relatorio)::integer,
        v_dia_fechamento
      );
    else
      v_inicio_ciclo := (
        make_date(
          extract(year from v_afetado.data_relatorio)::integer,
          extract(month from v_afetado.data_relatorio)::integer,
          1
        ) - interval '1 month' + (v_dia_fechamento - 1) * interval '1 day'
      )::date;
    end if;
    v_fim_ciclo := (v_inicio_ciclo + interval '1 month' - interval '1 day')::date;
    v_mes := extract(month from v_inicio_ciclo)::integer;
    v_ano := extract(year from v_inicio_ciclo)::integer;

    if exists (
      select 1
      from public.meses_fechados mf
      where mf.barbearia_id = v_barbearia_id
        and mf.mes = v_mes
        and mf.ano = v_ano
    ) then
      raise exception 'O ciclo %/% está fechado. Reabra antes de importar.', v_mes, v_ano;
    end if;

    insert into public.lancamentos_diarios (
      barbearia_id,
      barbeiro_id,
      data,
      valor,
      valor_faturamento,
      valor_comissao,
      atualizado_em
    ) values (
      v_barbearia_id,
      v_afetado.barbeiro_id,
      v_afetado.data_relatorio,
      case when v_base_meta = 'faturamento' then v_faturamento else v_comissao end,
      v_faturamento,
      v_comissao,
      now()
    )
    on conflict (barbeiro_id, data)
    do update set
      barbearia_id = excluded.barbearia_id,
      valor = excluded.valor,
      valor_faturamento = excluded.valor_faturamento,
      valor_comissao = excluded.valor_comissao,
      atualizado_em = now();

    insert into pg_temp.importacao_agenda_barbeiro_ciclos (
      barbeiro_id, inicio_ciclo, fim_ciclo, mes, ano
    ) values (
      v_afetado.barbeiro_id, v_inicio_ciclo, v_fim_ciclo, v_mes, v_ano
    )
    on conflict do nothing;
    insert into pg_temp.importacao_agenda_ciclos (mes, ano)
    values (v_mes, v_ano)
    on conflict do nothing;
  end loop;

  for v_bc in
    select barbeiro_id, inicio_ciclo, fim_ciclo, mes, ano
    from pg_temp.importacao_agenda_barbeiro_ciclos
  loop
    select
      coalesce(round(sum(
        coalesce(
          ld.valor_faturamento,
          case when v_base_meta = 'faturamento' then ld.valor else 0 end
        )
      ), 2), 0),
      coalesce(round(sum(
        coalesce(
          ld.valor_comissao,
          case when v_base_meta = 'comissao' then ld.valor else 0 end
        )
      ), 2), 0)
    into v_total_faturamento, v_total_comissao
    from public.lancamentos_diarios ld
    where ld.barbearia_id = v_barbearia_id
      and ld.barbeiro_id = v_bc.barbeiro_id
      and ld.data between v_bc.inicio_ciclo and v_bc.fim_ciclo;

    v_total_base := case
      when v_base_meta = 'faturamento' then v_total_faturamento
      else v_total_comissao
    end;

    insert into public.lancamentos (
      barbearia_id,
      barbeiro_id,
      mes,
      ano,
      comissao_acumulada,
      valor_faturamento,
      valor_comissao,
      modo
    ) values (
      v_barbearia_id,
      v_bc.barbeiro_id,
      v_bc.mes,
      v_bc.ano,
      v_total_base,
      v_total_faturamento,
      v_total_comissao,
      'direto'
    )
    on conflict (barbearia_id, barbeiro_id, mes, ano)
    do update set
      comissao_acumulada = excluded.comissao_acumulada,
      valor_faturamento = excluded.valor_faturamento,
      valor_comissao = excluded.valor_comissao,
      modo = 'direto';
  end loop;

  for v_bc in select mes, ano from pg_temp.importacao_agenda_ciclos
  loop
    update public.metas m
    set faturamento_acumulado = coalesce((
      select round(sum(l.comissao_acumulada), 2)
      from public.lancamentos l
      join public.barbeiros b on b.id = l.barbeiro_id
      where l.barbearia_id = v_barbearia_id
        and l.mes = v_bc.mes
        and l.ano = v_bc.ano
        and b.ativo = true
        and coalesce(b.tipo, 'barbeiro') <> 'recepcionista'
    ), 0)
    where m.barbearia_id = v_barbearia_id
      and m.mes = v_bc.mes
      and m.ano = v_bc.ano;
  end loop;

  select
    coalesce(round(sum(f.movimento_faturamento), 2), 0),
    coalesce(round(sum(f.movimento_comissao), 2), 0)
  into v_total_faturamento, v_total_comissao
  from public.importacao_agenda_fotos f
  where f.barbearia_id = v_barbearia_id
    and f.data_relatorio = p_data_relatorio
    and f.barbeiro_id in (
      select (item ->> 'barbeiroId')::uuid
      from jsonb_array_elements(p_itens) item
    );

  update public.importacao_agenda_lotes
  set resumo = jsonb_build_object(
    'modoMeta', v_modo_meta,
    'baseMeta', v_base_meta,
    'movimentoFaturamento', v_total_faturamento,
    'movimentoComissao', v_total_comissao,
    'fotosRecalculadas', (select count(*) from pg_temp.importacao_agenda_afetados)
  )
  where id = v_lote_id;

  return jsonb_build_object(
    'ok', true,
    'loteId', v_lote_id,
    'dataRelatorio', p_data_relatorio,
    'reimportacao', v_reimportacao,
    'profissionais', jsonb_array_length(p_itens),
    'movimentoFaturamento', v_total_faturamento,
    'movimentoComissao', v_total_comissao,
    'baseMeta', v_base_meta,
    'fotosRecalculadas', (select count(*) from pg_temp.importacao_agenda_afetados)
  );
end;
$$;

revoke all on function public.confirmar_importacao_agenda(text, text, date, date, jsonb) from public;
grant execute on function public.confirmar_importacao_agenda(text, text, date, date, jsonb) to authenticated;

-- Quando o dono troca o modo/base, as duas trilhas continuam intactas e esta
-- função apenas troca qual delas alimenta os campos legados de meta/ranking.
create or replace function public.sincronizar_base_importacao_agenda()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_barbearia_id uuid;
  v_base_meta text;
begin
  if v_usuario_id is null
     or lower(coalesce(auth.jwt() ->> 'email', '')) <> 'barbeariademoi@gmail.com' then
    return jsonb_build_object('ok', false, 'sincronizado', false);
  end if;

  select
    u.barbearia_id,
    case
      when coalesce(b.modo_meta, 'comissao') = 'faturamento' then 'faturamento'
      when coalesce(b.modo_meta, 'comissao') = 'comissao' then 'comissao'
      else coalesce(b.base_meta, 'comissao')
    end
  into v_barbearia_id, v_base_meta
  from public.usuarios u
  join public.barbearias b on b.id = u.barbearia_id
  where u.id = v_usuario_id;

  if v_barbearia_id is null or not exists (
    select 1 from public.importacao_agenda_fotos f
    where f.barbearia_id = v_barbearia_id
  ) then
    return jsonb_build_object('ok', true, 'sincronizado', false);
  end if;

  update public.lancamentos l
  set comissao_acumulada = case
    when v_base_meta = 'faturamento' then coalesce(l.valor_faturamento, 0)
    else coalesce(l.valor_comissao, 0)
  end
  where l.barbearia_id = v_barbearia_id
    and exists (
      select 1 from public.importacao_agenda_fotos f
      where f.barbearia_id = v_barbearia_id
        and f.barbeiro_id = l.barbeiro_id
    );

  update public.lancamentos_diarios ld
  set valor = case
    when v_base_meta = 'faturamento' then coalesce(ld.valor_faturamento, 0)
    else coalesce(ld.valor_comissao, 0)
  end
  where ld.barbearia_id = v_barbearia_id
    and exists (
      select 1 from public.importacao_agenda_fotos f
      where f.barbearia_id = v_barbearia_id
        and f.barbeiro_id = ld.barbeiro_id
        and f.data_relatorio = ld.data
    );

  update public.metas m
  set faturamento_acumulado = coalesce((
    select round(sum(l.comissao_acumulada), 2)
    from public.lancamentos l
    join public.barbeiros b on b.id = l.barbeiro_id
    where l.barbearia_id = v_barbearia_id
      and l.mes = m.mes
      and l.ano = m.ano
      and b.ativo = true
      and coalesce(b.tipo, 'barbeiro') <> 'recepcionista'
  ), 0)
  where m.barbearia_id = v_barbearia_id;

  return jsonb_build_object(
    'ok', true,
    'sincronizado', true,
    'baseMeta', v_base_meta
  );
end;
$$;

revoke all on function public.sincronizar_base_importacao_agenda() from public;
grant execute on function public.sincronizar_base_importacao_agenda() to authenticated;

comment on table public.importacao_agenda_fotos is
  'Fotos acumuladas diárias do relatório do Agenda Serviço; uma por barbeiro e data.';
comment on function public.confirmar_importacao_agenda(text, text, date, date, jsonb) is
  'Confirma atomicamente uma foto do Agenda, recalcula o movimento e atualiza meta/ranking.';
