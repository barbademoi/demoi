-- =====================================================================
-- TAREFIX — 012 · Período das recorrentes
--
-- inicio / fim (opcionais) nas tarefas que se repetem e nas missões
-- recorrentes da mentoria: só valem entre essas datas.
-- Ex.: rotina nova a partir de 01/12; campanha de Natal de 01 a 24/12.
-- =====================================================================

alter table tarefix.tarefas_modelo add column if not exists inicio date;
alter table tarefix.tarefas_modelo add column if not exists fim date;
alter table tarefix.tarefas_modelo drop constraint if exists tarefas_modelo_periodo;
alter table tarefix.tarefas_modelo add constraint tarefas_modelo_periodo check (inicio is null or fim is null or fim >= inicio);

alter table tarefix.missoes add column if not exists inicio date;
alter table tarefix.missoes add column if not exists fim date;
alter table tarefix.missoes drop constraint if exists missoes_periodo;
alter table tarefix.missoes add constraint missoes_periodo check (inicio is null or fim is null or fim >= inicio);
