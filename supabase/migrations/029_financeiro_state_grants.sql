-- 029_financeiro_state_grants.sql
-- Schema do modulo Controle Financeiro: estado por usuario, gate por compra
-- (entitlement por e-mail) e RLS. Esta migration formaliza o que ja existia
-- no projeto Supabase (aplicado direto pelo SQL Editor como "0001_financeiro")
-- mas que nunca foi versionado aqui. Tudo idempotente.
--
-- Usado pelo app embutido (BarberMeta) E pelo app standalone (pasta financeiro/),
-- que compartilham o mesmo projeto Supabase.

-- 1) ESTADO DO FINANCEIRO -------------------------------------------------
-- Todo o estado do app (caixa, contas, recebimentos, equipe) como um unico
-- JSON por usuario. Espelha o armazenamento local original do app.
create table if not exists public.financeiro_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2) PERMISSAO / CADEADO (por e-mail) ------------------------------------
-- A liberacao e gravada por E-MAIL (nao por user_id), porque na Hotmart o
-- cliente pode comprar ANTES de ter conta. Ao entrar com o mesmo e-mail, o
-- acesso resolve sozinho. So o webhook (service role) escreve aqui.
create table if not exists public.financeiro_grants (
  email      text primary key,
  active     boolean not null default true,
  source     text,                       -- ex.: 'hotmart:PRODUCT_ID/OFFER_CODE'
  updated_at timestamptz not null default now()
);

-- 3) FUNCAO QUE DIZ SE O USUARIO LOGADO TEM ACESSO -----------------------
-- security definer: le os grants ignorando RLS, mas so usa o e-mail do
-- proprio usuario logado (auth.jwt()).
create or replace function public.has_financeiro()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.financeiro_grants g
    where lower(g.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and g.active = true
  );
$$;

grant execute on function public.has_financeiro() to authenticated;

-- 4) RLS ------------------------------------------------------------------
alter table public.financeiro_state  enable row level security;
alter table public.financeiro_grants enable row level security;
-- (financeiro_grants fica SEM policies pra clientes => so o service role do
--  webhook escreve, que ignora RLS.)

-- O dado financeiro so e acessivel se for do proprio usuario E ele tiver a
-- permissao liberada. Esta e a TRAVA REAL — vale mesmo que burlem a tela.
drop policy if exists "financeiro_state_rw" on public.financeiro_state;
create policy "financeiro_state_rw"
  on public.financeiro_state
  for all
  to authenticated
  using      (user_id = auth.uid() and public.has_financeiro())
  with check (user_id = auth.uid() and public.has_financeiro());

comment on table public.financeiro_state is
  'Estado completo do Controle Financeiro (JSON) por usuario. RLS exige '
  'has_financeiro() = true.';
comment on table public.financeiro_grants is
  'Liberacao do Controle Financeiro por e-mail. Escrito pelo webhook Hotmart. '
  'Nunca lida diretamente pelo cliente.';
comment on function public.has_financeiro() is
  'Retorna true se o e-mail do usuario logado tem grant ativo de Financeiro.';

-- 5) (opcional) liberar/revogar na mao, para suporte ---------------------
--   insert into public.financeiro_grants (email, active, source)
--   values ('cliente@email.com', true, 'manual:suporte')
--   on conflict (email) do update set active = true, updated_at = now();
