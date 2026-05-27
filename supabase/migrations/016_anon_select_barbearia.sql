-- 016_anon_select_barbearia.sql
-- BUG RAIZ DA VISIBILIDADE DO RANKING (sistêmico, afetava todos os links de barbeiro).
--
-- A tabela `barbearias` tinha RLS habilitado mas só a policy `dono_select_barbearia`
-- (SELECT exigindo id = get_barbearia_id(), ou seja, dono LOGADO). A página pública
-- /b/[codigo] é anônima — então a leitura da barbearia retornava NULL e o código caía
-- no fallback `?? 'completo'`. Efeitos:
--   • visibilidade_ranking sempre virava 'completo' (mostrava valores de todos)
--   • modalidade não era lida (isAutonomo sempre false)
--   • dia_fechamento sempre caía em 1 (ignorava o ciclo personalizado)
--
-- As demais tabelas que a página do barbeiro usa (barbeiros, metas, metas_individuais,
-- lancamentos) já tinham policy anônima de leitura — só faltava a `barbearias`.
--
-- Esta migration adiciona a leitura anônima, no mesmo padrão das outras tabelas.
-- A `barbearias` não guarda dado sensível (email/pagamento ficam em usuarios e
-- compras_pendentes); só nome, logo, cor, horários e configs de exibição.
--
-- Idempotente — seguro de rodar em produção mesmo que a policy já exista.

drop policy if exists "anon_select_barbearia" on barbearias;

create policy "anon_select_barbearia" on barbearias
  for select using (true);
