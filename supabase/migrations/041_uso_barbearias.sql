-- 041_uso_barbearias.sql
-- Função que classifica cada barbearia por INTENSIDADE DE USO do BarberMeta,
-- pra separar quem usa todo dia de quem comprou e largou.
--
-- POR QUE TRÊS FONTES DE ATIVIDADE
-- Cada perfil de uso deixa rastro numa tabela diferente, e olhar só uma delas
-- classifica cliente ativo como inativo:
--   • lancamentos_diarios  → dono lançando o dia (ou a extensão do Agenda Serviço)
--   • controle_diario      → barbeiro lançando pontos da campanha pelo link dele
--   • dias_sem_pontuacao   → barbeiro marcando "não pontuei hoje" (abriu o app!)
-- A união das três, por DIA distinto, é o sinal de uso.
--
-- CRITÉRIO
-- "Diária" exige atividade em 2/3 da janela E no máximo 2 dias parada: 2/3
-- (20 dos 30 dias) e não a janela inteira porque barbearia fecha domingo/
-- segunda — quem lança todo dia útil chega a ~26. O corte de dias parados
-- separa quem usa AGORA de quem usou muito e abandonou na semana passada.
-- "Frequente" é 1/3 da janela. Os limites são proporcionais pra janela de 60
-- ou 90 dias medir o mesmo ritmo, e não ficar mais fácil de ser "diária".
--
-- `usa_mensal` marca quem lança o acumulado do mês de uma vez: essa barbearia
-- não aparece em nenhuma das três fontes diárias e cairia como "Inativa" sem
-- estar abandonada — está usando em outro ritmo.
--
-- security definer: lê tabelas de todas as barbearias ignorando RLS. Por isso
-- o EXECUTE fica só com service_role — quem chama é o servidor, na página
-- /admin/uso, que já valida o e-mail do admin antes.

create or replace function public.admin_uso_barbearias(p_dias int default 30)
returns table (
  barbearia_id    uuid,
  nome            text,
  dias_ativos     bigint,
  ultimo_uso      date,
  dias_parado     int,
  barbeiros       bigint,
  usa_mensal      boolean,
  uso             text
)
language sql
stable
security definer
set search_path = public
as $$
  with hoje as (
    select (now() at time zone 'America/Sao_Paulo')::date as d
  ),
  atividade as (
    select ld.barbearia_id, ld.data
      from public.lancamentos_diarios ld, hoje
     where ld.data > hoje.d - p_dias and ld.data <= hoje.d
    union
    select b.barbearia_id, cd.data
      from public.controle_diario cd
      join public.barbeiros b on b.id = cd.barbeiro_id
     cross join hoje
     where cd.data > hoje.d - p_dias and cd.data <= hoje.d
    union
    select dp.barbearia_id, dp.data
      from public.dias_sem_pontuacao dp, hoje
     where dp.data > hoje.d - p_dias and dp.data <= hoje.d
  ),
  agg as (
    select a.barbearia_id,
           count(distinct a.data) as dias_ativos,
           max(a.data)            as ultimo
      from atividade a
     group by a.barbearia_id
  ),
  equipe as (
    select b.barbearia_id, count(*) as qtd
      from public.barbeiros b
     where b.ativo = true
     group by b.barbearia_id
  ),
  mensal as (
    select l.barbearia_id
      from public.lancamentos l, hoje
     where l.updated_at >= (hoje.d - p_dias)::timestamptz
     group by l.barbearia_id
  )
  select
    b.id,
    b.nome,
    coalesce(a.dias_ativos, 0)                        as dias_ativos,
    a.ultimo                                          as ultimo_uso,
    ((select d from hoje) - a.ultimo)::int            as dias_parado,
    coalesce(e.qtd, 0)                                as barbeiros,
    (m.barbearia_id is not null)                      as usa_mensal,
    case
      when coalesce(a.dias_ativos, 0) = 0 then 'inativa'
      -- Limites proporcionais à janela (2/3 e 1/3), pra 60 e 90 dias usarem a
      -- mesma régua que 30: 20/30 dias ativos é o mesmo ritmo que 60/90.
      when a.dias_ativos >= (p_dias * 2.0 / 3)
       and ((select d from hoje) - a.ultimo) <= 2     then 'diaria'
      when a.dias_ativos >= (p_dias / 3.0)            then 'frequente'
      else                                                 'esporadica'
    end                                               as uso
  from public.barbearias b
  left join agg    a on a.barbearia_id = b.id
  left join equipe e on e.barbearia_id = b.id
  left join mensal m on m.barbearia_id = b.id
  order by coalesce(a.dias_ativos, 0) desc, b.nome;
$$;

revoke all on function public.admin_uso_barbearias(int) from public, anon, authenticated;
grant execute on function public.admin_uso_barbearias(int) to service_role;

comment on function public.admin_uso_barbearias(int) is
  'Uso do BarberMeta por barbearia numa janela de dias (padrão 30): dias com '
  'atividade, último uso e classificação diaria/frequente/esporadica/inativa. '
  'Só service_role executa — a tela /admin/uso valida o admin antes de chamar.';
