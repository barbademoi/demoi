-- Adiciona rastreamento de edições em controle_diario.
-- O campo lancado_por (que já existe da migration 002) registra quem CRIOU o registro.
-- editado_por + editado_em registram quem EDITOU por último (se foi editado).

ALTER TABLE controle_diario
  ADD COLUMN IF NOT EXISTS editado_por TEXT CHECK (editado_por IS NULL OR editado_por IN ('barbeiro','dono')),
  ADD COLUMN IF NOT EXISTS editado_em  TIMESTAMPTZ;
