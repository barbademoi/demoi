-- Adiciona campos de atendimento na tabela de lançamentos diários.
-- Permite que o dono informe "atendimentos hoje" junto com o faturamento
-- diário, e o sistema acumula no total do mês (lancamentos.numero_atendimentos
-- pra individual e metas.numero_atendimentos pra coletivo).

ALTER TABLE lancamentos_diarios
  ADD COLUMN IF NOT EXISTS numero_atendimentos INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS atendimentos_geral  INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lancamentos_diarios_atend_nonneg'
  ) THEN
    ALTER TABLE lancamentos_diarios
      ADD CONSTRAINT lancamentos_diarios_atend_nonneg
      CHECK (numero_atendimentos >= 0 AND atendimentos_geral >= 0);
  END IF;
END $$;
