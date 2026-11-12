-- =====================================================================
-- TAREFIX — 006 · Tarefas do dia todo, peso e autoavaliação
--
-- continua        → tarefa que vale o dia inteiro (atendimento, comandas…).
--                   Fica fixa no topo; o check só libera perto do fechamento.
-- peso            → 1, 2 ou 3: vale como 1, 2 ou 3 tarefas no percentual.
-- autoavaliacao   → 1..5, o colaborador diz como foi ao confirmar uma
--                   tarefa do dia todo (não entra no percentual).
-- empresas.liberar_continuas_min → quantos minutos antes do fechamento o
--                   check das tarefas do dia todo é liberado (padrão 60).
-- Pode rodar mais de uma vez.
-- =====================================================================

alter table tarefix.tarefas_modelo  add column if not exists continua boolean not null default false;
alter table tarefix.tarefas_modelo  add column if not exists peso smallint not null default 1;
alter table tarefix.tarefas_avulsas add column if not exists continua boolean not null default false;
alter table tarefix.tarefas_avulsas add column if not exists peso smallint not null default 1;
alter table tarefix.tarefas_dia     add column if not exists continua boolean not null default false;
alter table tarefix.tarefas_dia     add column if not exists peso smallint not null default 1;
alter table tarefix.tarefas_dia     add column if not exists autoavaliacao smallint;
alter table tarefix.empresas        add column if not exists liberar_continuas_min int not null default 60;

do $$
declare t text;
begin
  foreach t in array array['tarefas_modelo', 'tarefas_avulsas', 'tarefas_dia'] loop
    if not exists (select 1 from pg_constraint where conname = t || '_peso_valido') then
      execute format('alter table tarefix.%1$s add constraint %1$s_peso_valido check (peso between 1 and 3)', t);
    end if;
  end loop;
  if not exists (select 1 from pg_constraint where conname = 'tarefas_dia_autoavaliacao_valida') then
    alter table tarefix.tarefas_dia add constraint tarefas_dia_autoavaliacao_valida
      check (autoavaliacao is null or autoavaliacao between 1 and 5);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'empresas_liberar_continuas_valido') then
    alter table tarefix.empresas add constraint empresas_liberar_continuas_valido
      check (liberar_continuas_min between 0 and 720);
  end if;
end $$;
