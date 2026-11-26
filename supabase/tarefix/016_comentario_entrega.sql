-- =====================================================================
-- TAREFIX — 016 · Comentário do mentor numa entrega
-- O mentor comenta uma missão (ex.: uma que não foi feita); o mentorado vê
-- o recado no link e recebe uma notificação.
-- =====================================================================

alter table tarefix.entregas add column if not exists comentario text;
alter table tarefix.entregas add column if not exists comentario_em timestamptz;
