-- 055_acesso_anual.sql
--
-- TERCEIRO TIPO DE ACESSO: 'anual' — COMPRA ÚNICA de 1 ano.
--
-- O produto 7737399 da Hotmart passa a valer 1 ano em vez de para sempre. É o
-- MESMO produto que vendia o vitalício por R$ 47 e agora vende 1 ano por R$ 97
-- — o dono só trocou o preço, o link de checkout continua o mesmo.
--
-- ── O QUE ESTA MIGRATION NÃO FAZ ──────────────────────────────────────────
-- NÃO TOCA EM NENHUM REGISTRO EXISTENTE. Quem está gravado como 'vitalicio'
-- continua 'vitalicio' — os ~600 que compraram acesso permanente compraram
-- acesso permanente, e uma mudança de preço na Hotmart não retroage sobre
-- gente que já pagou. Não há um único UPDATE em `usuarios` aqui.
--
-- A mudança vale só pra EVENTOS NOVOS do webhook, daqui pra frente.
--
-- ── OS TRÊS TIPOS, E POR QUE OS NOMES CONFUNDEM ──────────────────────────
--   vitalicio → permanente. Nunca checado por validade. Régua nenhuma.
--   mensal    → ASSINATURA RECORRENTE (produto 8272423). O nome é histórico:
--               a coluna `periodicidade` é que diz se ela renova por mês ou
--               por ano. Vale enquanto a assinatura está em dia.
--   anual     → COMPRA ÚNICA de 1 ano (produto 7737399). Não renova sozinha;
--               pra continuar, o cliente compra de novo pelo mesmo link.
--
-- Ou seja: `tipo_acesso='mensal'` + `periodicidade='anual'` é o ASSINANTE
-- recorrente anual, e é coisa DIFERENTE de `tipo_acesso='anual'`. Um renova
-- sozinho no cartão, o outro não.
--
-- Idempotente.

-- ── 1. Domínio: passa a aceitar 'anual' ───────────────────────────────────
-- O CHECK antigo (migration 047) só permitia vitalicio/mensal. Sem ampliar,
-- o webhook receberia 23514 ao gravar a primeira compra nova — o cliente
-- pagaria R$ 97 e ficaria sem conta.
do $$ begin
  if exists (select 1 from pg_constraint where conname = 'usuarios_tipo_acesso_valido') then
    alter table public.usuarios drop constraint usuarios_tipo_acesso_valido;
  end if;
  alter table public.usuarios
    add constraint usuarios_tipo_acesso_valido
    check (tipo_acesso in ('vitalicio', 'mensal', 'anual'));
end $$;

comment on column public.usuarios.tipo_acesso is
  'vitalicio = acesso permanente, NUNCA checado por validade/assinatura. '
  'mensal = ASSINATURA RECORRENTE (a coluna periodicidade diz se renova por '
  'mês ou por ano), válida enquanto está em dia. '
  'anual = COMPRA ÚNICA de 1 ano (produto 7737399): vale até valido_ate e '
  'não renova sozinha — pra continuar, o cliente compra de novo. '
  'SEM DEFAULT de propósito: todo caminho que cria conta diz explicitamente.';

-- ── 2. Régua de validade: 'anual' entra junto com 'mensal' ────────────────
-- Só muda a primeira linha do WHERE. Tudo o mais (carência de 3 dias, fuso de
-- São Paulo, cancelada não corta antes do fim, validade nula libera) fica
-- idêntico — é a mesma régua, aplicada a mais um tipo.
--
-- VITALÍCIO CONTINUA SAINDO AQUI: ele não está na lista, então a função
-- devolve false pra ele exatamente como antes, e quem consulta trata o
-- vitalício antes de chegar nessa comparação.
create or replace function public.assinatura_ativa_conta(
  p_tipo       text,
  p_status     text,
  p_valido_ate timestamptz
)
returns boolean
language sql
stable
as $$
  select
    -- VITALÍCIO SAI AQUI. Nunca chega nas comparações de data abaixo.
    p_tipo in ('mensal', 'anual')
    and (
      -- Acesso pago sem validade é falha NOSSA de dado, não inadimplência —
      -- `avaliarAcesso()` libera e marca 'revisar'; aqui libera igual.
      p_valido_ate is null
      -- Cancelada NÃO corta antes do fim do período pago, de propósito: quem
      -- cancelou já pagou o período corrente. O cancelamento é o que impede a
      -- renovação, não o que apaga o que foi pago. (Não se aplica ao 'anual',
      -- que não tem cancelamento de recorrência — mas a regra é a mesma.)
      or (p_valido_ate at time zone 'America/Sao_Paulo')::date
           >= ((now() at time zone 'America/Sao_Paulo')::date - 3)
    );
$$;

comment on function public.assinatura_ativa_conta(text, text, timestamptz) is
  'Régua de acesso pago em SQL, espelho de avaliarAcesso() no app: mensal '
  '(assinatura recorrente) OU anual (compra única de 1 ano), dentro da '
  'validade + 3 dias de carência, fuso São Paulo. Vitalício sempre false '
  'aqui — ele não é regido por validade.';

-- ── 3. Conferência: o comportamento novo é ADITIVO ────────────────────────
-- Falha alto se alguma dessas quatro coisas deixar de valer.
do $$
declare
  v_futuro timestamptz := now() + interval '30 days';
  v_ontem  timestamptz := now() - interval '1 day';
  v_velho  timestamptz := now() - interval '90 days';
begin
  -- (a) VITALÍCIO nunca entra na régua de validade, em nenhuma combinação.
  if public.assinatura_ativa_conta('vitalicio', 'ativa',      v_futuro)
     or public.assinatura_ativa_conta('vitalicio', 'cancelada', v_velho)
     or public.assinatura_ativa_conta('vitalicio', null,        null)
     or public.assinatura_ativa_conta('vitalicio', null,        v_ontem) then
    raise exception 'REGRESSÃO: vitalício entrou na régua de validade.';
  end if;

  -- (b) O assinante recorrente continua se comportando exatamente como antes.
  if not public.assinatura_ativa_conta('mensal', 'ativa', v_futuro) then
    raise exception 'REGRESSÃO: assinante mensal em dia deixou de ser ativo.';
  end if;
  if public.assinatura_ativa_conta('mensal', 'ativa', v_velho) then
    raise exception 'REGRESSÃO: assinante mensal vencido há 90 dias virou ativo.';
  end if;

  -- (c) ANUAL válido libera; anual vencido (passada a carência) bloqueia.
  if not public.assinatura_ativa_conta('anual', 'ativa', v_futuro) then
    raise exception 'FALHA: anual dentro da validade deveria liberar.';
  end if;
  if not public.assinatura_ativa_conta('anual', 'ativa', v_ontem) then
    raise exception 'FALHA: anual vencido ONTEM deveria estar na carência de 3 dias.';
  end if;
  if public.assinatura_ativa_conta('anual', 'ativa', v_velho) then
    raise exception 'FALHA: anual vencido há 90 dias deveria bloquear.';
  end if;

  -- (d) Nenhum registro existente saiu do domínio.
  if exists (
    select 1 from public.usuarios
     where tipo_acesso is null or tipo_acesso not in ('vitalicio', 'mensal', 'anual')
  ) then
    raise exception 'Há usuário com tipo_acesso fora do domínio. Corrija antes.';
  end if;

  raise notice 'OK: anual entra na régua, vitalício e mensal intocados.';
end $$;

-- ── 4. Quantos há de cada tipo (só pra registrar no log da execução) ──────
do $$
declare v_vit int; v_men int; v_anu int;
begin
  select count(*) into v_vit from public.usuarios where tipo_acesso = 'vitalicio';
  select count(*) into v_men from public.usuarios where tipo_acesso = 'mensal';
  select count(*) into v_anu from public.usuarios where tipo_acesso = 'anual';
  raise notice 'Antes/depois desta migration os números são os MESMOS: vitalicio=%, mensal=%, anual=%', v_vit, v_men, v_anu;
end $$;
