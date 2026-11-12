-- =====================================================================
-- TAREFIX — 007 · Observações do colaborador nas tarefas
--
-- observacao     → texto curto (até 200) que o colaborador escreve na tarefa
--                  ("faltou produto", "torneira pingando"…), feita ou não.
--                  Editável até o dia fechar. Não entra no percentual.
-- observacao_em  → quando foi escrita/alterada (horário do servidor).
-- Pode rodar mais de uma vez.
-- =====================================================================

alter table tarefix.tarefas_dia add column if not exists observacao text;
alter table tarefix.tarefas_dia add column if not exists observacao_em timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tarefas_dia_observacao_tamanho') then
    alter table tarefix.tarefas_dia add constraint tarefas_dia_observacao_tamanho
      check (observacao is null or char_length(observacao) <= 200);
  end if;
end $$;

-- novo tipo de aviso para o sininho do dono
alter table tarefix.avisos drop constraint if exists avisos_tipo_check;
alter table tarefix.avisos add constraint avisos_tipo_check
  check (tipo in ('fechamento_dia', 'extra_nova', 'foto_enviada', 'observacao', 'geral'));
