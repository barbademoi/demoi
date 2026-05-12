-- =========================================================
-- ETAPA 1 — Gamificação por pontuação — BarberMeta
-- Execute este script no SQL Editor do Supabase
-- =========================================================

-- Modo do mês (metas | pontos | ambos)
CREATE TABLE IF NOT EXISTS modo_mes (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  barbearia_id  uuid NOT NULL REFERENCES barbearias(id) ON DELETE CASCADE,
  mes           integer NOT NULL,
  ano           integer NOT NULL,
  modo          text NOT NULL DEFAULT 'metas'
                  CHECK (modo IN ('metas', 'pontos', 'ambos')),
  created_at    timestamptz DEFAULT now(),
  UNIQUE(barbearia_id, mes, ano)
);

-- Campanha de pontos do mês
CREATE TABLE IF NOT EXISTS campanha (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  barbearia_id       uuid NOT NULL REFERENCES barbearias(id) ON DELETE CASCADE,
  mes                integer NOT NULL,
  ano                integer NOT NULL,
  min_pontos         integer NOT NULL DEFAULT 800,
  bonus_assin_qtd    integer NOT NULL DEFAULT 10,
  bonus_assin_valor  numeric(10,2) NOT NULL DEFAULT 200,
  created_at         timestamptz DEFAULT now(),
  UNIQUE(barbearia_id, mes, ano)
);

-- Serviços pontuáveis configurados pelo dono
CREATE TABLE IF NOT EXISTS campanha_servicos (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id uuid NOT NULL REFERENCES campanha(id) ON DELETE CASCADE,
  emoji       text NOT NULL DEFAULT '⭐',
  nome        text NOT NULL,
  pontos      integer NOT NULL DEFAULT 10,
  created_at  timestamptz DEFAULT now()
);

-- Premiação por posição no ranking de pontos
CREATE TABLE IF NOT EXISTS campanha_premios (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id uuid NOT NULL REFERENCES campanha(id) ON DELETE CASCADE,
  posicao     integer NOT NULL,
  valor       numeric(10,2) NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(campanha_id, posicao)
);

-- Lançamentos diários de serviços por barbeiro
CREATE TABLE IF NOT EXISTS controle_diario (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  barbeiro_id uuid NOT NULL REFERENCES barbeiros(id) ON DELETE CASCADE,
  campanha_id uuid NOT NULL REFERENCES campanha(id) ON DELETE CASCADE,
  data        date NOT NULL,
  servico_id  uuid NOT NULL REFERENCES campanha_servicos(id) ON DELETE CASCADE,
  quantidade  integer NOT NULL DEFAULT 0,
  lancado_por text NOT NULL DEFAULT 'barbeiro'
                CHECK (lancado_por IN ('dono', 'barbeiro')),
  created_at  timestamptz DEFAULT now(),
  UNIQUE(barbeiro_id, data, servico_id)
);

-- RLS desabilitado (acesso via anon key / service role)
-- Habilite e configure policies conforme necessidade de produção
