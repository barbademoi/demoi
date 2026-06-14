-- 027_feedback_grants.sql
-- Gate de PLUS pro modulo Feedback de Cliente.
--
-- Estrategia: grandfather de quem ja era cliente quando a feature passou
-- a ser PLUS. Quem comprou R$47 ANTES do corte continua usando Feedback.
-- Quem comprar a partir do corte: so libera com combo PLUS.
--
-- Tabela `feedback_grants` espelha `financeiro_grants` (apenas combo
-- escreve aqui; standalone Financeiro NAO libera Feedback).
--
-- Funcao `has_feedback()` retorna true se:
--   (a) tem grant ativo na tabela, OU
--   (b) usuario criado antes do CUTOFF (grandfather)
--
-- A trava REAL ainda fica em policies de RLS quando aplicada nas tabelas
-- relevantes; por ora gating eh no client (igual financeiro).
--
-- Idempotente.

create table if not exists public.feedback_grants (
  email      text primary key,
  active     boolean not null default true,
  source     text,
  updated_at timestamptz not null default now()
);

create or replace function public.has_feedback()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    exists (
      select 1
      from public.feedback_grants g
      where lower(g.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and g.active = true
    )
    or exists (
      select 1
      from auth.users u
      where u.id = auth.uid()
        and u.created_at < timestamptz '2026-06-14 01:00:00+00'
    );
$$;

grant execute on function public.has_feedback() to authenticated;

alter table public.feedback_grants enable row level security;

-- Sem policies pra autenticados — so service role escreve via webhook.
-- has_feedback() roda como security definer e ignora RLS.

comment on table public.feedback_grants is
  'Liberacao de Feedback de Cliente. Escrito pelo webhook Hotmart quando '
  'oferta inclui Feedback (combo). Nunca lida diretamente pelo cliente.';

comment on function public.has_feedback() is
  'Retorna true se usuario logado tem acesso ao Feedback de Cliente: '
  'tem grant ativo OU foi criado antes de 2026-06-14 01:00 UTC (grandfather).';
