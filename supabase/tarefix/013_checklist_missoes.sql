-- =====================================================================
-- TAREFIX — 013 · Checklist nas missões da mentoria
-- missoes.checklist  → itens (texto) definidos pelo mentor
-- entregas.checklist → [{"t": texto, "f": feito}] marcados pelo mentorado
-- =====================================================================

alter table tarefix.missoes  add column if not exists checklist text[] not null default '{}';
alter table tarefix.entregas add column if not exists checklist jsonb not null default '[]'::jsonb;
