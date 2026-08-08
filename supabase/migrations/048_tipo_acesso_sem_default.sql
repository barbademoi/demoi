-- 048_tipo_acesso_sem_default.sql
-- Remove o DEFAULT 'vitalicio' de usuarios.tipo_acesso.
--
-- ⚠️ RODE SÓ DEPOIS QUE O CÓDIGO DA PARTE 2 ESTIVER NO AR.
--
-- A coluna é NOT NULL. Enquanto existir o default, uma linha nova que não
-- informe tipo_acesso nasce VITALÍCIA em silêncio — que é exatamente o risco
-- de vender assinatura com o webhook antigo. Só que, tirando o default antes
-- do deploy, os inserts que ainda não informam a coluna passam a FALHAR e a
-- criação de conta quebra em produção.
--
-- Por isso a ordem é: deploy do código → esta migration. Os três caminhos que
-- criam conta já gravam tipo_acesso explicitamente:
--   • app/api/webhook/hotmart/route.ts     → pelo product_id/oferta
--   • app/api/webhook/mercadopago/route.ts → 'vitalicio'
--   • app/admin/contas/actions.ts          → 'vitalicio'
--
-- Depois disto, esquecer de informar o tipo vira ERRO na hora — que é o
-- comportamento que se quer: falhar alto em vez de dar acesso permanente de
-- graça.

alter table public.usuarios alter column tipo_acesso drop default;

comment on column public.usuarios.tipo_acesso is
  'vitalicio = acesso permanente, NUNCA checado por validade/assinatura. '
  'mensal = válido enquanto a assinatura está ativa (a periodicidade diz se '
  'renova por mês ou por ano). SEM DEFAULT de propósito: todo caminho que cria '
  'conta precisa dizer explicitamente qual é.';

-- Conferência: ninguém pode ter ficado fora do domínio.
do $$
declare v_fora int;
begin
  select count(*) into v_fora from public.usuarios
   where tipo_acesso is null or tipo_acesso not in ('vitalicio', 'mensal');
  if v_fora > 0 then
    raise exception '% usuário(s) com tipo_acesso inválido. Corrija antes.', v_fora;
  end if;
  raise notice 'OK: default removido; todos os usuários com tipo_acesso válido.';
end $$;
