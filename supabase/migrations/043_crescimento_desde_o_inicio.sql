-- 043_crescimento_desde_o_inicio.sql
-- Amplia o painel de crescimento: além da variação recente, passa a mostrar o
-- faturamento DE QUANDO A BARBEARIA ENTROU e o quanto subiu desde então, mês a
-- mês (e não só último ciclo fechado contra o anterior).
--
-- O QUE É "O MÊS EM QUE ENTROU"
-- Não é a data de cadastro: barbearia costuma criar conta e só começar a lançar
-- semanas depois, e um mês inicial vazio faria o crescimento explodir do nada.
-- Por isso o marco é o PRIMEIRO MÊS COM FATURAMENTO — o primeiro mês que
-- realmente virou número. `entrou_em` (data do cadastro) vai junto, à parte,
-- pra dar contexto de quanto tempo levou pra começar.
--
-- JANELA
-- A série continua limitada a p_ciclos (é o que o gráfico desenha), mas o
-- primeiro/último mês varrem o HISTÓRICO INTEIRO — senão "desde o início"
-- mentiria para quem usa há mais tempo que a janela.
--
-- SOBRE "POR MÊS"
-- metas/lancamentos são gravados por mês+ano de referência. Pra quem fecha no
-- dia 1 — a maioria — isso É o mês do calendário. Pra quem tem dia_fechamento
-- diferente, é o mês do ciclo dela. Não dá pra converter esses em mês de
-- calendário sem jogar fora quem lança só o total do mês, que não tem registro
-- diário; então o mês aqui é sempre o mês de referência já registrado.
--
-- O último mês pode ser o mês CORRENTE, ainda em andamento: `ultimo_em_andamento`
-- avisa, pra tela não comparar meio mês com mês inteiro sem dizer.
--
-- Substitui a função da 042 (o tipo de retorno muda, então precisa de DROP).
-- Idempotente.

drop function if exists public.admin_crescimento_barbearias(int);

create or replace function public.admin_crescimento_barbearias(p_ciclos int default 6)
returns table (
  barbearia_id        uuid,
  nome                text,
  dia_fechamento      int,
  entrou_em           date,
  serie               jsonb,
  atual_parcial       numeric,
  ultimo_fechado      numeric,
  anterior_fechado    numeric,
  crescimento_pct     numeric,
  tendencia           text,
  -- Desde o início (histórico completo)
  primeiro_mes        int,
  primeiro_ano        int,
  primeiro_valor      numeric,
  ultimo_mes          int,
  ultimo_ano          int,
  ultimo_valor        numeric,
  ultimo_em_andamento boolean,
  meses_com_dados     int,
  crescimento_total   numeric,
  crescimento_mensal  numeric
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
    select b.id, b.nome, coalesce(b.dia_fechamento, 1) as dia_fech, b.created_at::date as entrou
      from public.barbearias b
  ),
  ciclo_atual as (
    select base.id, base.nome, base.dia_fech, base.entrou,
           case
             when extract(day from hoje.d) >= base.dia_fech
               then make_date(extract(year from hoje.d)::int, extract(month from hoje.d)::int, 1)
             else make_date(extract(year from hoje.d)::int, extract(month from hoje.d)::int, 1) - interval '1 month'
           end::date as ref
      from base, hoje
  ),
  periodos as (
    select c.id, c.nome, c.dia_fech, c.entrou, c.ref as ref_atual, i.offset_i,
           (c.ref - (i.offset_i || ' months')::interval)::date as ref
      from ciclo_atual c
     cross join generate_series(0, p_ciclos - 1) as i(offset_i)
  ),
  valores as (
    select p.id, p.nome, p.dia_fech, p.entrou, p.offset_i, p.ref,
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
    select v.id, v.nome, v.dia_fech, v.entrou,
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
     group by v.id, v.nome, v.dia_fech, v.entrou
  ),
  -- ── Histórico COMPLETO: todo mês de referência que teve faturamento ──
  meses_todos as (
    select m.barbearia_id, m.mes, m.ano
      from public.metas m
     where coalesce(m.faturamento_acumulado, 0) > 0
    union
    select l.barbearia_id, l.mes, l.ano
      from public.lancamentos l
      join public.barbeiros b on b.id = l.barbeiro_id and b.ativo = true
     where coalesce(l.comissao_acumulada, 0) > 0
  ),
  hist as (
    select t.barbearia_id, t.mes, t.ano,
           coalesce(
             nullif((select m.faturamento_acumulado
                       from public.metas m
                      where m.barbearia_id = t.barbearia_id
                        and m.mes = t.mes and m.ano = t.ano), 0),
             (select coalesce(sum(l.comissao_acumulada), 0)
                from public.lancamentos l
                join public.barbeiros b on b.id = l.barbeiro_id and b.ativo = true
               where l.barbearia_id = t.barbearia_id
                 and l.mes = t.mes and l.ano = t.ano),
             0
           )::numeric as valor
      from meses_todos t
  ),
  hist_ok as (
    select * from hist where valor > 0
  ),
  extremos as (
    select h.barbearia_id,
           count(*)::int                                                as meses_com_dados,
           (array_agg(h.mes   order by h.ano, h.mes))[1]                as primeiro_mes,
           (array_agg(h.ano   order by h.ano, h.mes))[1]                as primeiro_ano,
           (array_agg(h.valor order by h.ano, h.mes))[1]                as primeiro_valor,
           (array_agg(h.mes   order by h.ano desc, h.mes desc))[1]      as ultimo_mes,
           (array_agg(h.ano   order by h.ano desc, h.mes desc))[1]      as ultimo_ano,
           (array_agg(h.valor order by h.ano desc, h.mes desc))[1]      as ultimo_valor
      from hist_ok h
     group by h.barbearia_id
  )
  select
    a.id,
    a.nome,
    a.dia_fech,
    a.entrou,
    a.serie,
    coalesce(a.atual_parcial, 0),
    coalesce(a.ultimo_fechado, 0),
    coalesce(a.anterior_fechado, 0),
    case when coalesce(a.anterior_fechado, 0) > 0
         then round(((a.ultimo_fechado - a.anterior_fechado) / a.anterior_fechado) * 100, 1)
    end,
    case
      when coalesce(a.anterior_fechado, 0) = 0 then 'sem_base'
      when ((a.ultimo_fechado - a.anterior_fechado) / a.anterior_fechado) * 100 >=  5 then 'subindo'
      when ((a.ultimo_fechado - a.anterior_fechado) / a.anterior_fechado) * 100 <= -5 then 'caindo'
      else 'estavel'
    end,
    e.primeiro_mes,
    e.primeiro_ano,
    coalesce(e.primeiro_valor, 0),
    e.ultimo_mes,
    e.ultimo_ano,
    coalesce(e.ultimo_valor, 0),
    -- O último mês com dado é o ciclo corrente? Então ainda está rodando.
    (e.ultimo_mes = extract(month from c.ref)::int
     and e.ultimo_ano = extract(year from c.ref)::int)                  as ultimo_em_andamento,
    coalesce(e.meses_com_dados, 0),
    -- Crescimento acumulado do primeiro mês até o último.
    case when coalesce(e.primeiro_valor, 0) > 0 and e.meses_com_dados > 1
         then round(((e.ultimo_valor - e.primeiro_valor) / e.primeiro_valor) * 100, 1)
    end                                                                 as crescimento_total,
    -- Média mensal composta no intervalo entre o primeiro e o último mês —
    -- média simples do total dividido pelos meses exageraria em série longa.
    case when coalesce(e.primeiro_valor, 0) > 0 and e.meses_com_dados > 1
         then round((
                power(
                  (e.ultimo_valor / e.primeiro_valor)::numeric,
                  1.0 / greatest(
                    (e.ultimo_ano * 12 + e.ultimo_mes) - (e.primeiro_ano * 12 + e.primeiro_mes),
                    1
                  )
                ) - 1
              ) * 100, 1)
    end                                                                 as crescimento_mensal
  from agg a
  join ciclo_atual c on c.id = a.id
  left join extremos e on e.barbearia_id = a.id
  order by
    case when coalesce(e.primeiro_valor, 0) > 0 and e.meses_com_dados > 1
         then (e.ultimo_valor - e.primeiro_valor) / e.primeiro_valor end desc nulls last,
    a.nome;
$$;

revoke all on function public.admin_crescimento_barbearias(int) from public, anon, authenticated;
grant execute on function public.admin_crescimento_barbearias(int) to service_role;

comment on function public.admin_crescimento_barbearias(int) is
  'Faturamento por ciclo (série jsonb) + variação recente + evolução desde o '
  'primeiro mês com faturamento: primeiro/último mês, crescimento acumulado e '
  'média mensal composta. Só service_role executa.';
