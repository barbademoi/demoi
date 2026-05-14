CREATE TABLE lancamentos_diarios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbearia_id UUID REFERENCES barbearias(id) ON DELETE CASCADE,
  barbeiro_id  UUID REFERENCES barbeiros(id)  ON DELETE CASCADE,
  data         DATE        NOT NULL,
  valor        NUMERIC(10,2) NOT NULL DEFAULT 0,
  criado_em    TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (barbeiro_id, data)
);

ALTER TABLE lancamentos_diarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dono_acessa_lancamentos_diarios"
  ON lancamentos_diarios
  FOR ALL
  USING (
    barbearia_id IN (
      SELECT u.barbearia_id FROM usuarios u WHERE u.id = auth.uid()
    )
  );
