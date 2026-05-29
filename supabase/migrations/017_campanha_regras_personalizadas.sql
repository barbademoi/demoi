-- 017_campanha_regras_personalizadas.sql
-- Adiciona campo de regras personalizadas (combinados específicos da barbearia)
-- na campanha. As regras FIXAS do sistema (4 padrões) vivem no código
-- (lib/regras.ts) e não precisam ir pro banco — são iguais pra todas as
-- barbearias e nunca editáveis pelo dono.
--
-- Idempotente — seguro de rodar em produção mesmo que a coluna já exista.

alter table campanha
  add column if not exists regras_personalizadas text;

comment on column campanha.regras_personalizadas is
  'Texto livre com combinados específicos da barbearia. Mostrado abaixo das '
  'regras fixas do sistema na configuração e na aba de regras da tela do barbeiro.';
