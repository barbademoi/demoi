-- Adiciona campo numero_atendimentos em lancamentos (usado pelo ticket médio
-- no modo autônomo). Default 0 preserva o comportamento das barbearias em
-- modo equipe — elas simplesmente não usam o campo.

ALTER TABLE lancamentos
  ADD COLUMN IF NOT EXISTS numero_atendimentos INTEGER NOT NULL DEFAULT 0;

-- Sanity: garante que valores negativos não sejam inseridos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lancamentos_numero_atendimentos_nonneg'
  ) THEN
    ALTER TABLE lancamentos
      ADD CONSTRAINT lancamentos_numero_atendimentos_nonneg
      CHECK (numero_atendimentos >= 0);
  END IF;
END $$;
