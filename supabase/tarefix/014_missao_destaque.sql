-- =====================================================================
-- TAREFIX — 014 · Missão em destaque (prioridade)
-- Fica no topo da lista do mentorado, com cor diferente.
-- =====================================================================

alter table tarefix.missoes add column if not exists destaque boolean not null default false;
