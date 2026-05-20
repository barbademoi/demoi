-- Adiciona campo numero_atendimentos em metas (mensal, coletivo da barbearia).
-- Permite que o dono cadastre o total de atendimentos da casa quando lança
-- o faturamento direto na Meta Coletiva — alimenta o ticket médio coletivo
-- sem depender de cada barbeiro preencher individualmente.

ALTER TABLE metas
  ADD COLUMN IF NOT EXISTS numero_atendimentos INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'metas_numero_atendimentos_nonneg'
  ) THEN
    ALTER TABLE metas
      ADD CONSTRAINT metas_numero_atendimentos_nonneg
      CHECK (numero_atendimentos >= 0);
  END IF;
END $$;
