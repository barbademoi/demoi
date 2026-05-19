-- 010_visibilidade_ranking.sql
-- Adiciona configuração de privacidade do ranking que o barbeiro vê
-- na página individual /b/[codigo].
--
-- Valores:
--   'completo' (padrão): barbeiro vê posições + valores de comissão dos colegas
--   'posicoes':          barbeiro vê posições (1º, 2º, 3º…) mas NÃO os valores
--   'proprio':           barbeiro vê só o próprio progresso, sem ranking algum
--
-- Idempotente — seguro de rodar em produção mesmo que a coluna já exista.
-- Todas as 25+ barbearias existentes recebem 'completo' por default
-- (preserva comportamento atual).

alter table barbearias
  add column if not exists visibilidade_ranking text
    not null default 'completo';

-- CHECK constraint só é criado se não existir (PostgreSQL não tem IF NOT
-- EXISTS pra check, então usamos try/catch via DO block).
do $$
begin
  alter table barbearias
    add constraint barbearias_visibilidade_ranking_check
    check (visibilidade_ranking in ('completo', 'posicoes', 'proprio'));
exception
  when duplicate_object then null;
end $$;

comment on column barbearias.visibilidade_ranking is
  'Privacidade do ranking pra cada barbeiro em /b/[codigo]. '
  '''completo'' = posições + valores | '
  '''posicoes'' = só posições, sem valores | '
  '''proprio'' = barbeiro vê só o próprio progresso, sem ranking.';
