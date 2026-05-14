-- Adiciona tipo (barbeiro | recepcionista) na tabela barbeiros
ALTER TABLE barbeiros
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'barbeiro'
    CHECK (tipo IN ('barbeiro', 'recepcionista'));

-- Adiciona mínimo de pontos separado para recepcionistas na campanha
ALTER TABLE campanha
  ADD COLUMN IF NOT EXISTS min_pontos_recep integer NOT NULL DEFAULT 400;
