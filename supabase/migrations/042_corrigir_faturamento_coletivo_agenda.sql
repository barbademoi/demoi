-- Corrige a separação entre:
--   1. base de metas/ranking individual (faturamento ou comissão); e
--   2. faturamento coletivo da barbearia (sempre faturamento bruto).
--
-- A migration 041 já havia sido aplicada no ambiente de teste. Por isso esta
-- migration também corrige os ciclos importados existentes e mantém a regra
-- em futuras confirmações sem exigir reimportação do PDF.

create or replace function public.recalcular_faturamento_coletivo_agenda(
  p_barbearia_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dia_fechamento integer;
  v_atualizados integer := 0;
begin
  select greatest(1, least(28, coalesce(b.dia_fechamento, 1)))
  into v_dia_fechamento
  from public.barbearias b
  where b.id = p_barbearia_id;

  if v_dia_fechamento is null then
    return 0;
  end if;

  with ciclos_importados as (
    select distinct
      extract(month from ciclo.inicio)::integer as mes,
      extract(year from ciclo.inicio)::integer as ano
    from public.importacao_agenda_fotos f
    cross join lateral (
      select case
        when extract(day from f.data_relatorio)::integer >= v_dia_fechamento
          then date_trunc('month', f.data_relatorio)::date
        else (date_trunc('month', f.data_relatorio) - interval '1 month')::date
      end as inicio
    ) ciclo
    where f.barbearia_id = p_barbearia_id
  )
  update public.metas m
  set faturamento_acumulado = coalesce((
    select round(sum(coalesce(l.valor_faturamento, 0)), 2)
    from public.lancamentos l
    join public.barbeiros b on b.id = l.barbeiro_id
    where l.barbearia_id = p_barbearia_id
      and l.mes = m.mes
      and l.ano = m.ano
      and b.ativo = true
      and coalesce(b.tipo, 'barbeiro') <> 'recepcionista'
  ), 0)
  where m.barbearia_id = p_barbearia_id
    and exists (
      select 1
      from ciclos_importados c
      where c.mes = m.mes
        and c.ano = m.ano
    );

  get diagnostics v_atualizados = row_count;
  return v_atualizados;
end;
$$;

revoke all on function public.recalcular_faturamento_coletivo_agenda(uuid) from public;

-- A confirmação da foto termina atualizando o resumo do lote. O gatilho roda
-- dentro da mesma transação e garante que o coletivo termine com faturamento
-- bruto, mesmo no banco que já recebeu a versão inicial da função.
create or replace function public.recalcular_faturamento_coletivo_apos_lote_agenda()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalcular_faturamento_coletivo_agenda(new.barbearia_id);
  return new;
end;
$$;

revoke all on function public.recalcular_faturamento_coletivo_apos_lote_agenda() from public;

drop trigger if exists trg_recalcular_faturamento_coletivo_agenda
  on public.importacao_agenda_lotes;
create trigger trg_recalcular_faturamento_coletivo_agenda
after update of resumo on public.importacao_agenda_lotes
for each row
execute function public.recalcular_faturamento_coletivo_apos_lote_agenda();

-- Trocar o modo/base continua atualizando apenas o espelho legado usado por
-- meta/ranking individual. Ao final, o coletivo é restaurado pelo bruto.
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
  v_metas_atualizadas integer := 0;
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

  v_metas_atualizadas :=
    public.recalcular_faturamento_coletivo_agenda(v_barbearia_id);

  return jsonb_build_object(
    'ok', true,
    'sincronizado', true,
    'baseMeta', v_base_meta,
    'metasColetivasAtualizadas', v_metas_atualizadas
  );
end;
$$;

revoke all on function public.sincronizar_base_importacao_agenda() from public;
grant execute on function public.sincronizar_base_importacao_agenda() to authenticated;

-- Corrige imediatamente os ciclos que já receberam uma foto antes desta
-- migration. A tabela de fotos está restrita à conta autorizada do teste.
do $$
declare
  v_barbearia record;
begin
  for v_barbearia in
    select distinct f.barbearia_id
    from public.importacao_agenda_fotos f
  loop
    perform public.recalcular_faturamento_coletivo_agenda(
      v_barbearia.barbearia_id
    );
  end loop;
end;
$$;

comment on function public.recalcular_faturamento_coletivo_agenda(uuid) is
  'Recalcula ciclos importados do Agenda usando sempre faturamento bruto, independente da base de meta/ranking.';
