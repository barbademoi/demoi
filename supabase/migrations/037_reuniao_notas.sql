-- 037_reuniao_notas.sql
-- MÓDULO DE REUNIÃO (preview/PLUS) — bloco de anotações com checklist do dono.
--
-- Só o DONO enxerga/edita (RLS por barbearia, mesmo molde do módulo de
-- comportamento). A página pública do barbeiro (/b/[codigo], anon key) NÃO tem
-- policy aqui, então get_barbearia_id() = NULL e ela não lê nada.
--
-- O raio-x e a pauta por IA são SÓ LEITURA sobre dados já existentes — não
-- precisam de tabela nova. Esta migration cria apenas a persistência das
-- anotações. Idempotente — seguro rodar em produção.

create table if not exists public.reuniao_notas (
  id            uuid default gen_random_uuid() primary key,
  barbearia_id  uuid not null references public.barbearias(id) on delete cascade,
  texto         text not null,
  feito         boolean not null default false,
  ordem         integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_reuniao_notas_barbearia on public.reuniao_notas(barbearia_id, ordem, created_at);

-- ── RLS: PRIVADO — SÓ O DONO ─────────────────────────────────────────────
alter table public.reuniao_notas enable row level security;

drop policy if exists "dono_all_reuniao_notas" on public.reuniao_notas;
create policy "dono_all_reuniao_notas" on public.reuniao_notas
  for all
  using (barbearia_id = get_barbearia_id())
  with check (barbearia_id = get_barbearia_id());

comment on table public.reuniao_notas is
  'Anotações/checklist da reunião — privadas do dono (RLS por barbearia). Módulo Reunião (preview).';

-- ── (FUTURO) tornar o módulo VENDÁVEL ────────────────────────────────────
-- Hoje o acesso é uma allowlist por e-mail no código (lib/reuniao/preview.ts).
-- Pra abrir como item comprável, replicar o molde de Feedback/Financeiro:
--
--   create table if not exists public.reuniao_grants (
--     email text primary key, active boolean not null default true,
--     source text, updated_at timestamptz not null default now()
--   );
--   alter table public.reuniao_grants enable row level security; -- sem policy p/ cliente
--   create or replace function public.has_reuniao()
--   returns boolean language sql stable security definer set search_path = public, auth
--   as $$ select exists (select 1 from public.reuniao_grants g
--     where lower(g.email) = lower(coalesce(auth.jwt() ->> 'email','')) and g.active); $$;
--   grant execute on function public.has_reuniao() to authenticated;
--
-- Depois é só trocar emailTemReuniao() por um rpc('has_reuniao') no lib/reuniao/access.ts.
