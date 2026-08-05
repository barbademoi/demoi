-- 042_crescimento_barbearias.sql
-- Função que mostra a EVOLUÇÃO DO FATURAMENTO de cada barbearia, ciclo a ciclo,
-- pra enxergar quem está crescendo e quem está encolhendo.
--
-- DE ONDE VEM O FATURAMENTO
-- Mesma regra que o dono vê no painel dele (lib/historicoMeses.ts):
--   1º) metas.faturamento_acumulado do ciclo, quando preenchido (> 0);
--   2º) senão, a soma de lancamentos.comissao_acumulada.
-- A soma conta SÓ barbeiro ativo — barbeiro inativado (soft-delete) continua
-- com lançamento gravado e inflaria o total ("comissão fantasma"). Se os
-- números daqui não batessem com o painel do cliente, o dado não serve.
--
-- CICLO, NÃO MÊS DE CALENDÁRIO
-- metas/lancamentos são gravados por mês+ano de REFERÊNCIA do ciclo, e cada
-- barbearia tem seu dia_fechamento. O ciclo corrente é o mês atual quando hoje
-- já passou do dia de fechamento, senão o mês anterior — mesma conta de
-- cicloDeData() em lib/ciclo.ts.
--
-- O CICLO CORRENTE ESTÁ PELA METADE
-- Comparar um ciclo em andamento com um ciclo fechado faria TODA barbearia
-- parecer em queda. Por isso o crescimento compara o último ciclo FECHADO com
-- o anterior a ele, e o valor do ciclo corrente vai à parte, em `atual_parcial`,
-- só como referência visual.
--
-- Sem base de comparação (ciclo anterior zerado, cliente novo) o crescimento
-- fica NULL e a tendência vira 'sem_base' — não é 0% nem 100%.
--
-- security definer: lê todas as barbearias ignorando RLS. EXECUTE só pro
-- service_role; a página /admin/crescimento valida o e-mail do admin antes.

create or replace function public.admin_crescimento_barbearias(p_ciclos int default 6)
returns table (
  barbearia_id     uuid,
  nome             text,
  dia_fechamento   int,
  serie            jsonb,
  atual_parcial    numeric,
  ultimo_fechado   numeric,
  anterior_fechado numeric,
  crescimento_pct  numeric,
  tendencia        text
)
language sql
stable
security definer
set search_path = public
as $$
  with hoje as (
    select (now() at time zone 'America/Sao_Paulo')::date as d
  ),
  base as (
    select b.id, b.nome, coalesce(b.dia_fechamento, 1) as dia_fech
      from public.barbearias b
  ),
  -- Primeiro dia do ciclo CORRENTE de cada barbearia (mesma regra do app).
  ciclo_atual as (
    select base.id, base.nome, base.dia_fech,
           case
             when extract(day from hoje.d) >= base.dia_fech
               then make_date(extract(year from hoje.d)::int, extract(month from hoje.d)::int, 1)
             else make_date(extract(year from hoje.d)::int, extract(month from hoje.d)::int, 1) - interval '1 month'
           end::date as ref
      from base, hoje
  ),
  -- Os p_ciclos períodos: i=0 é o corrente (parcial), i=1 o último fechado…
  periodos as (
    select c.id, c.nome, c.dia_fech, i.offset_i,
           (c.ref - (i.offset_i || ' months')::interval)::date as ref
      from ciclo_atual c
     cross join generate_series(0, p_ciclos - 1) as i(offset_i)
  ),
  -- Faturamento por (barbearia, ciclo), na mesma ordem de precedência do app.
  valores as (
    select p.id, p.nome, p.dia_fech, p.offset_i, p.ref,
           coalesce(
             nullif((select m.faturamento_acumulado
                       from public.metas m
                      where m.barbearia_id = p.id
                        and m.mes = extract(month from p.ref)::int
                        and m.ano = extract(year  from p.ref)::int), 0),
             (select coalesce(sum(l.comissao_acumulada), 0)
                from public.lancamentos l
                join public.barbeiros b on b.id = l.barbeiro_id and b.ativo = true
               where l.barbearia_id = p.id
                 and l.mes = extract(month from p.ref)::int
                 and l.ano = extract(year  from p.ref)::int),
             0
           )::numeric as valor
      from periodos p
  ),
  agg as (
    select v.id, v.nome, v.dia_fech,
           -- Série do mais antigo pro mais recente, pra desenhar direto na UI.
           jsonb_agg(
             jsonb_build_object(
               'mes',     extract(month from v.ref)::int,
               'ano',     extract(year  from v.ref)::int,
               'valor',   v.valor,
               'parcial', v.offset_i = 0
             ) order by v.ref
           )                                                          as serie,
           max(v.valor) filter (where v.offset_i = 0)                 as atual_parcial,
           max(v.valor) filter (where v.offset_i = 1)                 as ultimo_fechado,
           max(v.valor) filter (where v.offset_i = 2)                 as anterior_fechado
      from valores v
     group by v.id, v.nome, v.dia_fech
  )
  select
    a.id,
    a.nome,
    a.dia_fech,
    a.serie,
    coalesce(a.atual_parcial, 0),
    coalesce(a.ultimo_fechado, 0),
    coalesce(a.anterior_fechado, 0),
    case when coalesce(a.anterior_fechado, 0) > 0
         then round(((a.ultimo_fechado - a.anterior_fechado) / a.anterior_fechado) * 100, 1)
    end                                                               as crescimento_pct,
    case
      when coalesce(a.anterior_fechado, 0) = 0 then 'sem_base'
      when ((a.ultimo_fechado - a.anterior_fechado) / a.anterior_fechado) * 100 >=  5 then 'subindo'
      when ((a.ultimo_fechado - a.anterior_fechado) / a.anterior_fechado) * 100 <= -5 then 'caindo'
      else 'estavel'
    end                                                               as tendencia
  from agg a
  order by
    case when coalesce(a.anterior_fechado, 0) > 0
         then ((a.ultimo_fechado - a.anterior_fechado) / a.anterior_fechado) end desc nulls last,
    a.nome;
$$;

revoke all on function public.admin_crescimento_barbearias(int) from public, anon, authenticated;
grant execute on function public.admin_crescimento_barbearias(int) to service_role;

comment on function public.admin_crescimento_barbearias(int) is
  'Faturamento por ciclo de cada barbearia (série jsonb) + crescimento do último '
  'ciclo fechado sobre o anterior. O ciclo corrente sai separado em atual_parcial '
  'porque está em andamento. Só service_role executa.';
