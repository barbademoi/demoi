-- 054_admin_saude_clientes.sql
-- Painel administrativo de Customer Success.
--
-- A função apenas AGREGA sinais que o BarberMeta já registra. Nenhuma tabela,
-- regra de negócio, permissão de cliente ou fluxo do produto é alterado.
-- O execute pertence exclusivamente ao service_role; a página e a server
-- action que chamam a função ainda validam a allowlist do administrador.

-- Índices direcionados à consulta agregada. São idempotentes e não mudam dados.
create index if not exists idx_usuarios_barbearia
  on public.usuarios (barbearia_id);

create index if not exists idx_lancamentos_diarios_barbearia_data
  on public.lancamentos_diarios (barbearia_id, data desc);

create index if not exists idx_controle_diario_data_barbeiro
  on public.controle_diario (data desc, barbeiro_id);

create index if not exists idx_dias_sem_pontuacao_data_barbearia
  on public.dias_sem_pontuacao (data desc, barbearia_id, barbeiro_id);

create or replace function public.admin_saude_clientes()
returns table (
  barbearia_id                 uuid,
  nome                         text,
  cidade                       text,
  data_cadastro                timestamptz,
  email_dono                   text,
  telefone                     text,
  tipo_acesso                  text,
  periodicidade                text,
  status_assinatura            text,
  ultimo_login                 timestamptz,
  nunca_logou                  boolean,
  dias_sem_login               int,
  ultimo_lancamento_diario     date,
  nunca_lancou                 boolean,
  dias_sem_lancamento          int,
  quantidade_barbeiros         int,
  barbeiros_com_atividade_mes  int,
  dias_com_atividade_30        int
)
language sql
stable
security definer
set search_path = public
as $$
  with relogio as (
    select
      (now() at time zone 'America/Sao_Paulo')::date as hoje,
      date_trunc('month', now() at time zone 'America/Sao_Paulo')::date as inicio_mes
  ),
  donos_ordenados as (
    select
      u.barbearia_id,
      u.email,
      u.tipo_acesso,
      u.periodicidade,
      u.status_assinatura,
      au.last_sign_in_at,
      row_number() over (
        partition by u.barbearia_id
        order by coalesce(au.last_sign_in_at, u.created_at) desc, u.created_at desc
      ) as posicao
    from public.usuarios u
    left join auth.users au on au.id = u.id and au.deleted_at is null
    where u.tipo_acesso = 'mensal'
  ),
  donos as (
    select * from donos_ordenados where posicao = 1
  ),
  equipe as (
    select b.barbearia_id, count(*)::int as quantidade
    from public.barbeiros b
    where b.ativo = true and b.tipo = 'barbeiro'
    group by b.barbearia_id
  ),
  atividade_barbeiro_mes as (
    select b.barbearia_id, cd.barbeiro_id
    from public.controle_diario cd
    join public.barbeiros b on b.id = cd.barbeiro_id
    cross join relogio r
    where b.ativo = true
      and b.tipo = 'barbeiro'
      and cd.data >= r.inicio_mes
      and cd.data <= r.hoje
    union
    select dp.barbearia_id, dp.barbeiro_id
    from public.dias_sem_pontuacao dp
    join public.barbeiros b on b.id = dp.barbeiro_id
    cross join relogio r
    where b.ativo = true
      and b.tipo = 'barbeiro'
      and dp.data >= r.inicio_mes
      and dp.data <= r.hoje
  ),
  barbeiros_mes as (
    select ab.barbearia_id, count(distinct ab.barbeiro_id)::int as quantidade
    from atividade_barbeiro_mes ab
    group by ab.barbearia_id
  ),
  ultimos_lancamentos as (
    select ld.barbearia_id, max(ld.data) as ultimo
    from public.lancamentos_diarios ld
    group by ld.barbearia_id
  ),
  atividade_30 as (
    select ld.barbearia_id, ld.data
    from public.lancamentos_diarios ld
    cross join relogio r
    where ld.data > r.hoje - 30 and ld.data <= r.hoje
    union
    select b.barbearia_id, cd.data
    from public.controle_diario cd
    join public.barbeiros b on b.id = cd.barbeiro_id
    cross join relogio r
    where cd.data > r.hoje - 30 and cd.data <= r.hoje
    union
    select dp.barbearia_id, dp.data
    from public.dias_sem_pontuacao dp
    cross join relogio r
    where dp.data > r.hoje - 30 and dp.data <= r.hoje
  ),
  uso_30 as (
    select a.barbearia_id, count(distinct a.data)::int as dias
    from atividade_30 a
    group by a.barbearia_id
  )
  select
    b.id,
    b.nome,
    b.cidade,
    b.created_at,
    d.email,
    contato.telefone,
    d.tipo_acesso,
    d.periodicidade,
    d.status_assinatura,
    d.last_sign_in_at,
    (d.last_sign_in_at is null),
    case
      when d.last_sign_in_at is null then greatest(0, r.hoje - b.created_at::date)::int
      else floor(extract(epoch from (now() - d.last_sign_in_at)) / 86400)::int
    end as dias_sem_login,
    ul.ultimo,
    (ul.ultimo is null),
    case
      when ul.ultimo is null then greatest(0, r.hoje - b.created_at::date)::int
      else (r.hoje - ul.ultimo)::int
    end,
    coalesce(e.quantidade, 0),
    coalesce(bm.quantidade, 0),
    coalesce(u30.dias, 0)
  from public.barbearias b
  cross join relogio r
  left join donos d on d.barbearia_id = b.id
  left join lateral (
    select cp.telefone
    from public.compras_pendentes cp
    where d.email is not null
      and lower(cp.email) = lower(d.email)
      and nullif(regexp_replace(coalesce(cp.telefone, ''), '[^0-9]', '', 'g'), '') is not null
    order by cp.created_at desc
    limit 1
  ) contato on true
  left join equipe e on e.barbearia_id = b.id
  left join barbeiros_mes bm on bm.barbearia_id = b.id
  left join ultimos_lancamentos ul on ul.barbearia_id = b.id
  left join uso_30 u30 on u30.barbearia_id = b.id
  -- Este painel acompanha a base recorrente. Os 600+ clientes vitalícios
  -- continuam intactos no sistema e deliberadamente não entram neste CS.
  where d.tipo_acesso = 'mensal'
  order by b.nome;
$$;

revoke all on function public.admin_saude_clientes() from public, anon, authenticated;
grant execute on function public.admin_saude_clientes() to service_role;

comment on function public.admin_saude_clientes() is
  'Sinais agregados de adoção e risco dos assinantes (tipo_acesso=mensal). Executável somente pelo '
  'service_role; o acesso da interface é validado no servidor pela allowlist administrativa.';
