-- 024_barbearias_regras_gerais.sql
-- Permite que o dono edite as "Regras gerais da campanha" (texto exibido
-- na aba Regras do CampanhaModal e na pagina do barbeiro /b/[codigo]).
--
-- Antes: lista hardcoded em lib/regras.ts (REGRAS_FIXAS) — mesma pra
-- todas as barbearias, nao editavel.
-- Agora: array opcional por barbearia. NULL = usa o default (REGRAS_FIXAS).
-- Quando o dono edita, persiste o array completo aqui.
--
-- O default em lib/regras.ts continua sendo a fallback — barbearias
-- existentes nao veem mudanca ate o dono editar.
--
-- Idempotente.

alter table barbearias
  add column if not exists regras_gerais text[];

comment on column barbearias.regras_gerais is
  'Regras gerais da campanha editaveis pelo dono. NULL = usa REGRAS_FIXAS '
  'de lib/regras.ts (default do sistema). Array de strings, ordem importa.';
