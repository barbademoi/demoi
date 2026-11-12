-- =====================================================================
-- TAREFIX — 004 · Prazo (horário limite) e tempo estimado das tarefas
--
-- horario_limite      → "fazer até HH:MM" (opcional). Pendente depois disso
--                       aparece como atrasada; não muda o percentual.
-- tempo_estimado_min  → quanto a tarefa costuma levar, informado pelo dono
--                       (opcional, em minutos).
-- tarefas_dia guarda uma CÓPIA dos dois (como já faz com o título): mudar o
-- modelo depois não altera dias passados.
-- Pode rodar mais de uma vez.
-- =====================================================================

alter table tarefix.tarefas_modelo  add column if not exists horario_limite time;
alter table tarefix.tarefas_modelo  add column if not exists tempo_estimado_min int;
alter table tarefix.tarefas_avulsas add column if not exists horario_limite time;
alter table tarefix.tarefas_avulsas add column if not exists tempo_estimado_min int;
alter table tarefix.tarefas_dia     add column if not exists horario_limite time;
alter table tarefix.tarefas_dia     add column if not exists tempo_estimado_min int;

do $$
declare t text;
begin
  foreach t in array array['tarefas_modelo', 'tarefas_avulsas', 'tarefas_dia'] loop
    if not exists (select 1 from pg_constraint where conname = t || '_tempo_estimado_valido') then
      execute format(
        'alter table tarefix.%1$s add constraint %1$s_tempo_estimado_valido
           check (tempo_estimado_min is null or tempo_estimado_min between 1 and 600)', t);
    end if;
  end loop;
end $$;
