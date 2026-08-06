-- 045_crescimento_cidade_e_equipe.sql
-- Acrescenta CIDADE e QUANTIDADE DE BARBEIROS ao painel de crescimento, pra
-- alimentar o card de conteúdo ("Barbearia X, de Cidade Y, com N barbeiros").
--
-- `barbearias.cidade` já existe no banco (é o que a tela /configuracoes grava),
-- mas nunca entrou nas migrations versionadas. O ADD COLUMN IF NOT EXISTS
-- abaixo é justamente pra este arquivo poder rodar num banco limpo sem quebrar
-- — em produção ele não faz nada, porque a coluna já está lá.
--
-- A cidade pode ser nula (cadastro antigo, dono que nunca preencheu). A função
-- devolve NULL e quem exibe decide o texto — nada de string mágica no banco.
--
-- Conta só barbeiro ATIVO: barbeiro inativado (soft-delete) continua na tabela
-- e inflaria o tamanho da equipe num card que vai virar post.
--
-- Substitui a função da 044 (o tipo de retorno muda → precisa de DROP).
-- Idempotente.

alter table public.barbearias add column if not exists cidade text;

drop function if exists public.admin_crescimento_barbearias(int, numeric, int, int, numeric);

create or replace function public.admin_crescimento_barbearias(
  p_ciclos            int     default 6,
  p_piso_faturamento  numeric default 1500,
  p_dias_minimos      int     default 10,
  p_meses_minimos     int     default 2,
  p_outlier_pct       numeric default 300
)
returns table (
  barbearia_id       uuid,
  nome               text,
  cidade             text,
  qtd_barbeiros      int,
  dia_fechamento     int,
  entrou_em          date,
  serie              jsonb,
  atual_parcial      numeric,
  confiavel          boolean,
  motivo             text,
  meses_validos      int,
  ref_mes            int,
  ref_ano            int,
  ref_valor          numeric,
  ant_mes            int,
  ant_ano            int,
  ant_valor          numeric,
  consecutivos       boolean,
  crescimento_pct    numeric,
  outlier            boolean,
  primeiro_mes       int,
  primeiro_ano       int,
  primeiro_valor     numeric,
  crescimento_total  numeric
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
    select b.id, b.nome, b.cidade, coalesce(b.dia_fechamento, 1) as dia_fech,
           b.created_at::date as entrou
      from public.barbearias b
  ),
  ciclo_atual as (
    select base.*,
           case
             when extract(day from hoje.d) >= base.dia_fech
               then make_date(extract(year from hoje.d)::int, extract(month from hoje.d)::int, base.dia_fech)
             else make_date(extract(year from hoje.d)::int, extract(month from hoje.d)::int, base.dia_fech) - interval '1 month'
           end::date as ref_ini
      from base, hoje
  ),
  equipe as (
    select b.barbearia_id, count(*)::int as qtd
      from public.barbeiros b
     where b.ativo = true
     group by b.barbearia_id
  ),
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
    select
      t.barbearia_id, t.mes, t.ano,
      c.ref_ini,
      make_date(t.ano, t.mes, c.dia_fech)                                       as ini,
      (make_date(t.ano, t.mes, c.dia_fech) + interval '1 month - 1 day')::date  as fim,
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
      )::numeric                                                                as valor
      from meses_todos t
      join ciclo_atual c on c.id = t.barbearia_id
  ),
  hist_dias as (
    select h.*,
           (select count(distinct ld.data)
              from public.lancamentos_diarios ld
             where ld.barbearia_id = h.barbearia_id
               and ld.data >= h.ini and ld.data <= h.fim)::int as dias
      from hist h
  ),
  marcado as (
    select h.*,
           (h.ini < h.ref_ini)                                as fechado,
           (h.valor >= p_piso_faturamento)                    as acima_piso,
           (h.dias  >= p_dias_minimos)                        as bem_alimentado,
           (h.ini < h.ref_ini
            and h.valor >= p_piso_faturamento
            and h.dias  >= p_dias_minimos)                    as valido
      from hist_dias h
  ),
  serie_agg as (
    select s.barbearia_id,
           jsonb_agg(jsonb_build_object(
             'mes', s.mes, 'ano', s.ano, 'valor', s.valor, 'dias', s.dias,
             'parcial', not s.fechado,
             'acimaPiso', s.acima_piso,
             'bemAlimentado', s.bem_alimentado,
             'valido', s.valido
           ) order by s.ano, s.mes) as serie
      from (
        select m.*, row_number() over (partition by m.barbearia_id order by m.ano desc, m.mes desc) as rn
          from marcado m
      ) s
     where s.rn <= p_ciclos
     group by s.barbearia_id
  ),
  validos as (
    select m.*, row_number() over (partition by m.barbearia_id order by m.ano desc, m.mes desc) as rn_desc,
           row_number() over (partition by m.barbearia_id order by m.ano, m.mes)                as rn_asc,
           count(*)    over (partition by m.barbearia_id)                                       as qtd
      from marcado m
     where m.valido
  ),
  resumo as (
    select
      v.barbearia_id,
      max(v.qtd)::int                                              as meses_validos,
      max(v.mes)   filter (where v.rn_desc = 1)                    as ref_mes,
      max(v.ano)   filter (where v.rn_desc = 1)                    as ref_ano,
      max(v.valor) filter (where v.rn_desc = 1)                    as ref_valor,
      max(v.mes)   filter (where v.rn_desc = 2)                    as ant_mes,
      max(v.ano)   filter (where v.rn_desc = 2)                    as ant_ano,
      max(v.valor) filter (where v.rn_desc = 2)                    as ant_valor,
      max(v.mes)   filter (where v.rn_asc  = 1)                    as primeiro_mes,
      max(v.ano)   filter (where v.rn_asc  = 1)                    as primeiro_ano,
      max(v.valor) filter (where v.rn_asc  = 1)                    as primeiro_valor
      from validos v
     group by v.barbearia_id
  ),
  parcial as (
    select m.barbearia_id, max(m.valor) as valor
      from marcado m
     where not m.fechado
     group by m.barbearia_id
  ),
  diag as (
    select m.barbearia_id,
           count(*)                                                                    as total,
           count(*) filter (where m.fechado)                                           as fechados,
           count(*) filter (where m.fechado and not m.acima_piso)                      as reprov_piso,
           count(*) filter (where m.fechado and m.acima_piso and not m.bem_alimentado) as reprov_dias
      from marcado m
     group by m.barbearia_id
  )
  select
    c.id,
    c.nome,
    nullif(btrim(coalesce(c.cidade, '')), '')                      as cidade,
    coalesce(e.qtd, 0)                                             as qtd_barbeiros,
    c.dia_fech,
    c.entrou,
    coalesce(sa.serie, '[]'::jsonb),
    coalesce(p.valor, 0),
    (coalesce(r.meses_validos, 0) >= p_meses_minimos)              as confiavel,
    case
      when coalesce(r.meses_validos, 0) >= p_meses_minimos then null
      when coalesce(dg.total, 0) = 0                        then 'sem_lancamento'
      when coalesce(dg.fechados, 0) = 0                     then 'so_mes_em_curso'
      when coalesce(dg.reprov_piso, 0) > 0                  then 'base_fraca'
      when coalesce(dg.reprov_dias, 0) > 0                  then 'poucos_dias'
      else 'poucos_meses'
    end                                                            as motivo,
    coalesce(r.meses_validos, 0),
    r.ref_mes, r.ref_ano, r.ref_valor,
    r.ant_mes, r.ant_ano, r.ant_valor,
    case when r.ref_mes is not null and r.ant_mes is not null
         then (r.ref_ano * 12 + r.ref_mes) - (r.ant_ano * 12 + r.ant_mes) = 1
    end                                                            as consecutivos,
    case when coalesce(r.meses_validos, 0) >= p_meses_minimos and coalesce(r.ant_valor, 0) > 0
         then round(((r.ref_valor - r.ant_valor) / r.ant_valor) * 100, 1)
    end                                                            as crescimento_pct,
    case when coalesce(r.meses_validos, 0) >= p_meses_minimos and coalesce(r.ant_valor, 0) > 0
         then abs(((r.ref_valor - r.ant_valor) / r.ant_valor) * 100) > p_outlier_pct
         else false
    end                                                            as outlier,
    r.primeiro_mes, r.primeiro_ano, r.primeiro_valor,
    case when coalesce(r.meses_validos, 0) >= p_meses_minimos
          and coalesce(r.primeiro_valor, 0) > 0
          and (r.primeiro_ano * 12 + r.primeiro_mes) <> (r.ref_ano * 12 + r.ref_mes)
         then round(((r.ref_valor - r.primeiro_valor) / r.primeiro_valor) * 100, 1)
    end                                                            as crescimento_total
  from ciclo_atual c
  left join equipe    e  on e.barbearia_id  = c.id
  left join serie_agg sa on sa.barbearia_id = c.id
  left join resumo    r  on r.barbearia_id  = c.id
  left join parcial   p  on p.barbearia_id  = c.id
  left join diag      dg on dg.barbearia_id = c.id
  order by
    (coalesce(r.meses_validos, 0) >= p_meses_minimos) desc,
    case when coalesce(r.meses_validos, 0) >= p_meses_minimos and coalesce(r.ant_valor, 0) > 0
         then (r.ref_valor - r.ant_valor) / r.ant_valor end desc nulls last,
    c.nome;
$$;

revoke all on function public.admin_crescimento_barbearias(int, numeric, int, int, numeric) from public, anon, authenticated;
grant execute on function public.admin_crescimento_barbearias(int, numeric, int, int, numeric) to service_role;

comment on function public.admin_crescimento_barbearias(int, numeric, int, int, numeric) is
  'Crescimento por barbearia (só meses fechados, acima do piso e bem '
  'alimentados) + cidade e tamanho da equipe ativa, pra alimentar o card de '
  'conteúdo. Só service_role executa.';
