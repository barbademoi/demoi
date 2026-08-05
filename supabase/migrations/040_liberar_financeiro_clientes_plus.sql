-- 040_liberar_financeiro_clientes_plus.sql
-- Libera o Controle Financeiro pra quem JÁ COMPROU o Plus e ficou bloqueado.
--
-- SINTOMA
-- Cliente comprou o Plus (combo Financeiro + Feedback Premiado) e mesmo assim
-- bateu no cadeado do Financeiro.
--
-- CAUSA
-- O webhook da Hotmart decide cada módulo por listas SEPARADAS de oferta/produto
-- (FINANCEIRO_OFFERS/PRODUCTS e FEEDBACK_OFFERS/PRODUCTS — ver
-- supabase/functions/hotmart-webhook/index.ts). O Plus é vendido por mais de um
-- link (o combo da landing e o upgrade de dentro do app), então basta um desses
-- códigos faltar na lista do FINANCEIRO pra compra gravar `feedback_grants` e
-- NÃO gravar `financeiro_grants`. O cliente fica com o Feedback liberado e o
-- Financeiro trancado — exatamente a reclamação recebida.
--
-- COMO IDENTIFICAMOS QUEM TEM PLUS
-- `feedback_grants` só é escrito por oferta que inclui Feedback, isto é, o combo
-- Plus (o adicional avulso de Financeiro não escreve lá — ver 027). Logo:
--     feedback_grants.active = true  ⇒  o e-mail comprou o Plus
-- e todo e-mail nessa condição TEM que ter `financeiro_grants` ativo.
--
-- Vale inclusive quando existe linha de financeiro com active=false: reembolso
-- e chargeback desativam os DOIS módulos juntos, então "feedback ativo +
-- financeiro inativo" nunca é um reembolso legítimo do Plus.
--
-- LIMITE DESTE SCRIPT (importante)
-- Só alcança quem tem rastro no banco. Se o webhook não gravou NADA pra uma
-- compra (não disparou, Hottok errado, e-mail da Hotmart diferente do login),
-- não há evidência aqui — esses casos só saem do relatório da Hotmart. Use o
-- bloco 3 no fim do arquivo pra liberar essa lista à mão.
--
-- Idempotente: rodar de novo não duplica nem sobrescreve quem já está certo.

-- ── 1) REVISÃO — rode isto ANTES pra ver quem será afetado ──────────────────
-- Deixa o "antes" registrado no log da migration (nada é alterado aqui).
do $$
declare
  v_faltando int;
  v_inativos int;
  v_email    text;
begin
  select count(*) into v_faltando
  from public.feedback_grants fb
  where fb.active = true
    and not exists (
      select 1 from public.financeiro_grants fi
      where lower(fi.email) = lower(fb.email)
    );

  select count(*) into v_inativos
  from public.feedback_grants fb
  join public.financeiro_grants fi on lower(fi.email) = lower(fb.email)
  where fb.active = true and fi.active = false;

  raise notice 'Plus sem linha de financeiro: %', v_faltando;
  raise notice 'Plus com financeiro desativado: %', v_inativos;

  for v_email in
    select fb.email
    from public.feedback_grants fb
    left join public.financeiro_grants fi on lower(fi.email) = lower(fb.email)
    where fb.active = true and coalesce(fi.active, false) = false
    order by fb.email
  loop
    raise notice '  → liberando %', v_email;
  end loop;
end $$;

-- ── 2) LIBERAÇÃO ────────────────────────────────────────────────────────────
-- Todo e-mail com Plus (feedback ativo) passa a ter Financeiro ativo.
-- `source` marca a origem da correção sem apagar o histórico de quem já estava
-- ativo (esses não são tocados pelo WHERE do ON CONFLICT).
insert into public.financeiro_grants (email, active, source, updated_at)
select lower(fb.email), true, 'manual:backfill-plus-040', now()
from public.feedback_grants fb
where fb.active = true
on conflict (email) do update
  set active     = true,
      source     = 'manual:backfill-plus-040',
      updated_at = now()
  where public.financeiro_grants.active = false;

-- ── 3) CASOS SEM RASTRO NO BANCO (preencher à mão, se houver) ───────────────
-- Pra compras do Plus que o webhook não registrou em NENHUMA das duas tabelas.
-- Confira o e-mail no relatório da Hotmart, troque a lista e rode:
--
--   insert into public.financeiro_grants (email, active, source, updated_at)
--   values
--     (lower('cliente1@email.com'), true, 'manual:suporte-plus', now()),
--     (lower('cliente2@email.com'), true, 'manual:suporte-plus', now())
--   on conflict (email) do update
--     set active = true, source = excluded.source, updated_at = now();
--
--   insert into public.feedback_grants (email, active, source, updated_at)
--   values
--     (lower('cliente1@email.com'), true, 'manual:suporte-plus', now()),
--     (lower('cliente2@email.com'), true, 'manual:suporte-plus', now())
--   on conflict (email) do update
--     set active = true, source = excluded.source, updated_at = now();
--
-- Atenção ao e-mail: o acesso resolve por e-mail do login. Se a pessoa comprou
-- com um e-mail e entra no app com outro, libere o e-mail DO LOGIN.

-- ── 4) CONFERÊNCIA ──────────────────────────────────────────────────────────
do $$
declare
  v_restantes int;
begin
  select count(*) into v_restantes
  from public.feedback_grants fb
  left join public.financeiro_grants fi on lower(fi.email) = lower(fb.email)
  where fb.active = true and coalesce(fi.active, false) = false;

  if v_restantes > 0 then
    raise exception 'Ainda restaram % cliente(s) Plus sem Financeiro.', v_restantes;
  end if;

  raise notice 'OK: todo cliente com Plus tem o Financeiro liberado.';
end $$;
