-- =====================================================================
-- TAREFIX — 005 · Hora de começar
--
-- horario_inicio → "começar às HH:MM" (opcional). Com o tempo estimado,
-- dá o fim previsto (início + tempo) e monta o fluxo do dia. Se não houver
-- "fazer até", o fim previsto vira o prazo para marcar atraso.
-- Copiado para tarefas_dia como os demais campos. Pode rodar mais de uma vez.
-- =====================================================================

alter table tarefix.tarefas_modelo  add column if not exists horario_inicio time;
alter table tarefix.tarefas_avulsas add column if not exists horario_inicio time;
alter table tarefix.tarefas_dia     add column if not exists horario_inicio time;
