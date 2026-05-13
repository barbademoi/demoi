-- Mensagens diárias geradas pela IA por barbeiro
CREATE TABLE IF NOT EXISTS mensagens_ia (
  barbeiro_id UUID NOT NULL REFERENCES barbeiros(id) ON DELETE CASCADE,
  data        DATE NOT NULL,
  mensagem    TEXT NOT NULL,
  gerada_em   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (barbeiro_id, data)
);

-- Celebrações já exibidas (para não repetir)
CREATE TABLE IF NOT EXISTS celebracoes (
  barbeiro_id UUID    NOT NULL REFERENCES barbeiros(id) ON DELETE CASCADE,
  mes         INTEGER NOT NULL,
  ano         INTEGER NOT NULL,
  tier        TEXT    NOT NULL CHECK (tier IN ('bronze', 'prata', 'ouro')),
  exibida_em  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (barbeiro_id, mes, ano, tier)
);

ALTER TABLE mensagens_ia  ENABLE ROW LEVEL SECURITY;
ALTER TABLE celebracoes   ENABLE ROW LEVEL SECURITY;

-- Leitura pública (tela do barbeiro não tem auth)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mensagens_ia' AND policyname = 'allow public read mensagens_ia') THEN
    CREATE POLICY "allow public read mensagens_ia" ON mensagens_ia FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'celebracoes' AND policyname = 'allow public read celebracoes') THEN
    CREATE POLICY "allow public read celebracoes" ON celebracoes FOR SELECT USING (true);
  END IF;
END $$;
