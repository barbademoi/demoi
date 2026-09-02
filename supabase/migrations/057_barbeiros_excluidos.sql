-- 057_barbeiros_excluidos.sql
--
-- RASTRO DA EXCLUSÃO DEFINITIVA DE UM PROFISSIONAL.
--
-- Até aqui a única saída era desativar (ativo = false): o barbeiro some das
-- telas e o histórico dele fica. Agora existe também EXCLUIR, que apaga o
-- registro e, por efeito das chaves estrangeiras, tudo que estava pendurado
-- nele — lançamentos, metas individuais, pontos, conduta, Brindoleta.
--
-- Isso é irreversível e não tem "lixeira". Então fica um rastro do ato: quem
-- excluiu, quando, o nome de quem foi, e QUANTAS linhas de cada tipo foram
-- junto. Sem isso, um número que muda no relatório de um mês passado vira um
-- mistério sem explicação possível.
--
-- ── POR QUE `barbeiro_id` NÃO É CHAVE ESTRANGEIRA AQUI ────────────────────
-- Se fosse `references barbeiros(id) on delete cascade`, esta linha morreria
-- junto com o barbeiro e a auditoria não registraria nada. Se fosse
-- `on delete restrict`, impediria a própria exclusão. O id fica como uuid solto
-- de propósito: ele identifica quem foi sem depender de uma linha que já não
-- existe. Só `barbearia_id` é FK — a barbearia continua lá, e é ela que a RLS
-- usa para escopar.
--
-- Idempotente.

create table if not exists public.barbeiros_excluidos (
  id            uuid primary key default gen_random_uuid(),
  barbearia_id  uuid not null references public.barbearias(id) on delete cascade,

  -- Sem FK, de propósito (ver acima).
  barbeiro_id   uuid not null,
  nome          text not null,
  tipo          text,

  -- Quantas linhas de cada tabela foram apagadas junto, no formato
  -- {"lancamentos": 8, "brindoleta_sales": 3, ...}. Contado ANTES do delete,
  -- que é o único momento em que dá para contar.
  apagados      jsonb not null default '{}'::jsonb,

  -- Quem mandou apagar. SET NULL para que apagar um usuário não apague o
  -- registro do que ele fez.
  excluido_por  uuid references auth.users(id) on delete set null,
  excluido_em   timestamptz not null default now()
);

comment on table public.barbeiros_excluidos is
  'Rastro das exclusões definitivas de profissionais. barbeiro_id não é FK de propósito: a linha precisa sobreviver ao barbeiro que ela registra.';
comment on column public.barbeiros_excluidos.apagados is
  'Contagem por tabela do que o cascade levou junto, apurada antes do delete.';

create index if not exists idx_barbeiros_excluidos_barbearia
  on public.barbeiros_excluidos(barbearia_id, excluido_em desc);

-- ── RLS: só o dono da barbearia, e só para ler e acrescentar ──────────────
alter table public.barbeiros_excluidos enable row level security;

drop policy if exists "dono_select_barbeiros_excluidos" on public.barbeiros_excluidos;
create policy "dono_select_barbeiros_excluidos" on public.barbeiros_excluidos
  for select
  using (barbearia_id = get_barbearia_id());

drop policy if exists "dono_insert_barbeiros_excluidos" on public.barbeiros_excluidos;
create policy "dono_insert_barbeiros_excluidos" on public.barbeiros_excluidos
  for insert
  with check (barbearia_id = get_barbearia_id());

-- Sem update e sem delete: com RLS ligada, a ausência de policy é a proibição.
-- Um registro de exclusão que o próprio autor pudesse apagar não registraria
-- nada.

-- ── Auto-conferência ──────────────────────────────────────────────────────
do $$
declare
  n_policies int;
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'barbeiros_excluidos'
  ) then
    raise exception '057: tabela barbeiros_excluidos não foi criada';
  end if;

  -- A ausência de FK em barbeiro_id é o que garante que o rastro sobreviva ao
  -- delete. Se alguém acrescentar uma, a auditoria passa a se apagar sozinha.
  if exists (
    select 1
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
     where n.nspname = 'public'
       and t.relname = 'barbeiros_excluidos'
       and c.contype = 'f'
       and c.confrelid = 'public.barbeiros'::regclass
  ) then
    raise exception '057: barbeiros_excluidos.barbeiro_id não pode ser FK para barbeiros — o rastro morreria junto com o barbeiro';
  end if;

  if not exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename = 'barbeiros_excluidos' and rowsecurity
  ) then
    raise exception '057: RLS não está ligada em barbeiros_excluidos';
  end if;

  select count(*) into n_policies
  from pg_policies
  where schemaname = 'public' and tablename = 'barbeiros_excluidos';

  if n_policies <> 2 then
    raise exception '057: esperava exatamente 2 policies (select + insert), encontrei %', n_policies;
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'barbeiros_excluidos'
      and cmd in ('UPDATE', 'DELETE')
  ) then
    raise exception '057: há policy de update/delete em barbeiros_excluidos — o rastro não pode ser reescrito';
  end if;

  raise notice '057 ok: barbeiros_excluidos criada, sem FK para barbeiros, RLS ligada, só select+insert.';
end $$;
