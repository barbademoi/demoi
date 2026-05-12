-- Adiciona campo ativo na campanha
ALTER TABLE campanha ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

-- Garante que RLS está desabilitado nas tabelas de gamificação
-- (necessário para writes do anon key na tela pública do barbeiro)
ALTER TABLE modo_mes       DISABLE ROW LEVEL SECURITY;
ALTER TABLE campanha       DISABLE ROW LEVEL SECURITY;
ALTER TABLE campanha_servicos DISABLE ROW LEVEL SECURITY;
ALTER TABLE campanha_premios  DISABLE ROW LEVEL SECURITY;
ALTER TABLE controle_diario   DISABLE ROW LEVEL SECURITY;
