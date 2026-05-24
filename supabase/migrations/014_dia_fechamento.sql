-- Adiciona o dia de fechamento do mês (ciclo personalizado).
-- Default 1 preserva o comportamento atual de mês calendário pra todas
-- as barbearias existentes — só quem editar manualmente vai usar ciclo.
-- Range 1-28 evita problemas com fevereiro (sempre tem dia 28).

ALTER TABLE barbearias
  ADD COLUMN IF NOT EXISTS dia_fechamento SMALLINT NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'barbearias_dia_fechamento_range'
  ) THEN
    ALTER TABLE barbearias
      ADD CONSTRAINT barbearias_dia_fechamento_range
      CHECK (dia_fechamento >= 1 AND dia_fechamento <= 28);
  END IF;
END $$;
