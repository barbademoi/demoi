ALTER TABLE lancamentos_diarios
  ADD COLUMN IF NOT EXISTS faturamento_geral NUMERIC(10,2) DEFAULT 0;
