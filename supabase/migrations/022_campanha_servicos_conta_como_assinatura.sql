-- 022_campanha_servicos_conta_como_assinatura.sql
-- Flag explícita pra marcar quais itens da campanha devem contar pro bônus
-- de assinaturas (X assinaturas vendidas = R$ Y extra).
--
-- Antes: o contador "X/Y assinaturas para bônus" usava heurística por nome
-- (`s.nome.toLowerCase().includes('assinatura')`) em BarbeiroClient.tsx —
-- quebrava quando o item estava cadastrado como "Plano clube", "Sócio
-- mensal", etc., e ficava travado em 0 mesmo com vendas lançadas.
--
-- Agora: o dono marca explicitamente o(s) item(ns) que contam como
-- assinatura. Default FALSE — barbearias existentes não veem mudança até
-- marcarem o item. Quando marcam, o contador passa a refletir
-- retroativamente o que já foi vendido no ciclo (a fonte de dados é o
-- controle_diario, que já está salvo).
--
-- Idempotente — seguro de rodar em produção mesmo que a coluna já exista.

alter table campanha_servicos
  add column if not exists conta_como_assinatura boolean not null default false;

comment on column campanha_servicos.conta_como_assinatura is
  'Quando true, lançamentos deste item somam pro contador "X/Y assinaturas '
  'para bônus" na tela do barbeiro. Default false (configurado item a item '
  'pelo dono no CampanhaModal).';
