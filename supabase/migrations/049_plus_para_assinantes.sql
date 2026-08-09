-- 049_plus_para_assinantes.sql
-- Libera os TRÊS módulos Plus (Brindoleta, Financeiro, Feedback Premiado) para
-- quem tem ASSINATURA ATIVA — sem tocar em quem já tinha acesso por outra via.
--
-- REGRA DE OURO (a mesma do resto do sistema)
--   tipo_acesso = 'vitalicio' → NUNCA é checado por validade ou status. Esta
--   migration NÃO dá e NÃO tira nada dele: `assinatura_ativa_conta()` exige
--   tipo_acesso = 'mensal' logo na primeira condição, então pra vitalício ela
--   devolve false sempre, e um `or false` não muda o resultado de gate nenhum.
--   O vitalício continua com exatamente os módulos que já comprou/recebeu.
--
-- FORMATO DA MUDANÇA: tudo aqui é `or` — ADITIVO por construção. Nenhuma
-- condição existente foi removida ou apertada, então é impossível esta
-- migration tirar acesso de alguém. Quem tem grant, licença, cortesia ou
-- grandfather continua entrando pelo mesmo caminho de antes; a assinatura só
-- acrescenta uma porta nova ao lado.
--
-- E o contrário também vale: se a assinatura cair, o acesso cai só pra quem
-- entrava POR ELA. Quem tem o módulo por compra avulsa mantém, porque o outro
-- lado do `or` continua verdadeiro.
--
-- Idempotente.

-- ── 1. A régua, em três camadas ────────────────────────────────────────────
-- A lógica fica numa função pura (recebe os campos, decide) pra poder ser
-- testada isolada e reusada tanto por usuário logado quanto por barbearia.
-- É o espelho exato de `avaliarAcesso()` em lib/assinatura/acesso.ts: mesma
-- carência de 3 dias, mesmo fuso, mesma decisão sobre cancelada e sobre
-- validade ausente. Duas réguas que discordam viram suporte.

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
    p_tipo = 'mensal'
    and (
      -- Assinante sem validade é falha NOSSA de dado, não inadimplência —
      -- `avaliarAcesso()` libera e marca 'revisar'; aqui libera igual.
      p_valido_ate is null
      -- Cancelada NÃO corta antes do fim do período pago, de propósito: quem
      -- cancelou já pagou o mês corrente. O cancelamento é o que impede a
      -- renovação, não o que apaga o que foi pago.
      or (p_valido_ate at time zone 'America/Sao_Paulo')::date
           >= ((now() at time zone 'America/Sao_Paulo')::date - 3)
    );
$$;

comment on function public.assinatura_ativa_conta(text, text, timestamptz) is
  'Régua da assinatura em SQL, espelho de avaliarAcesso() no app: mensal e '
  'dentro da validade + 3 dias de carência (fuso São Paulo). Vitalício sempre '
  'false aqui — ele não é regido por validade.';

-- Do usuário LOGADO. É esta que entra nos gates dos módulos.
create or replace function public.assinatura_ativa()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.usuarios u
    where u.id = auth.uid()
      and public.assinatura_ativa_conta(u.tipo_acesso, u.status_assinatura, u.valido_ate)
  );
$$;

grant execute on function public.assinatura_ativa() to authenticated;

comment on function public.assinatura_ativa() is
  'true se o usuário logado é assinante com assinatura em dia. Usada como '
  'porta ADICIONAL nos gates dos módulos Plus.';

-- Da BARBEARIA. Existe porque a roleta pública da Brindoleta é aberta ao
-- cliente final — não há auth.uid() ali, e a pergunta é sobre a barbearia
-- dona do QR Code, não sobre quem escaneou.
create or replace function public.assinatura_ativa_barbearia(p_barbearia_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.usuarios u
    where u.barbearia_id = p_barbearia_id
      and public.assinatura_ativa_conta(u.tipo_acesso, u.status_assinatura, u.valido_ate)
  );
$$;

comment on function public.assinatura_ativa_barbearia(uuid) is
  'true se a barbearia tem dono assinante em dia. Usada pelo caminho público '
  'da Brindoleta, onde não existe usuário logado.';

-- ── 2. Os gates dos módulos ────────────────────────────────────────────────
-- Cada um ganha `or public.assinatura_ativa()` e nada mais muda. Estão
-- reescritos por inteiro (create or replace exige o corpo completo), mas o
-- que veio das migrations 027/029 e 202608040001 está idêntico.

-- FINANCEIRO — antes: só grant ativo por e-mail (migration 029).
create or replace function public.has_financeiro()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    exists (
      select 1
      from public.financeiro_grants g
      where lower(g.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and g.active = true
    )
    or public.assinatura_ativa();
$$;

grant execute on function public.has_financeiro() to authenticated;

comment on function public.has_financeiro() is
  'true se o usuário logado tem Financeiro: grant ativo por e-mail (compra '
  'avulsa/combo) OU assinatura ativa.';

-- FEEDBACK PREMIADO — antes: grant ativo OU grandfather por data de criação
-- (migration 027). O grandfather continua inteiro: é justamente ele que
-- protege quem comprou os R$47 antes do corte.
create or replace function public.has_feedback()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    exists (
      select 1
      from public.feedback_grants g
      where lower(g.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and g.active = true
    )
    or exists (
      select 1
      from auth.users u
      where u.id = auth.uid()
        and u.created_at < timestamptz '2026-06-14 01:00:00+00'
    )
    or public.assinatura_ativa();
$$;

grant execute on function public.has_feedback() to authenticated;

comment on function public.has_feedback() is
  'true se o usuário logado tem Feedback de Cliente: grant ativo, OU conta '
  'criada antes de 2026-06-14 01:00 UTC (grandfather), OU assinatura ativa.';

-- BRINDOLETA — antes: licença 'active' da barbearia (migration 202608040001).
create or replace function public.has_brindoleta()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    exists (
      select 1
      from public.brindoleta_licenses l
      where l.barbearia_id = public.get_barbearia_id()
        and l.status = 'active'
    )
    or public.assinatura_ativa();
$$;

grant execute on function public.has_brindoleta() to authenticated;

comment on function public.has_brindoleta() is
  'true se o usuário logado tem Brindoleta: licença avulsa ativa da barbearia '
  'OU assinatura ativa.';

-- Mesma pergunta, pela barbearia. O painel do dono e a roleta pública
-- precisam responder isso sobre uma barbearia específica — o dono porque as
-- telas mostram o estado da licença junto, e a roleta porque nem sequer tem
-- sessão. Uma função só evita as duas versões da regra saírem do lugar.
create or replace function public.brindoleta_liberada(p_barbearia_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    exists (
      select 1
      from public.brindoleta_licenses l
      where l.barbearia_id = p_barbearia_id
        and l.status = 'active'
    )
    or public.assinatura_ativa_barbearia(p_barbearia_id);
$$;

grant execute on function public.brindoleta_liberada(uuid) to authenticated, service_role;

comment on function public.brindoleta_liberada(uuid) is
  'true se a barbearia pode usar a Brindoleta: licença avulsa ativa OU dono '
  'assinante em dia. Vale pro painel do dono e pra roleta pública.';

-- ── 3. Conferência — a migration falha se a regra tiver saído do lugar ─────
-- São os quatro cenários que precisam valer. Rodam contra a função pura, sem
-- depender de dado real, e derrubam a transação inteira se algum inverter.
do $$
declare
  v_ontem   timestamptz := now() - interval '1 day';
  v_futuro  timestamptz := now() + interval '20 days';
  v_carencia timestamptz := now() - interval '2 days';
  v_velho   timestamptz := now() - interval '30 days';
begin
  -- 1) Assinante ATIVO entra.
  if not public.assinatura_ativa_conta('mensal', 'ativa', v_futuro) then
    raise exception 'Assinante ativo deveria ter acesso aos módulos Plus.';
  end if;

  -- 2) Assinante que venceu faz tempo NÃO entra pela assinatura.
  if public.assinatura_ativa_conta('mensal', 'cancelada', v_velho) then
    raise exception 'Assinatura vencida há 30 dias não pode liberar módulo Plus.';
  end if;

  -- 2b) …mas dentro da carência de 3 dias ainda entra, igual ao app.
  if not public.assinatura_ativa_conta('mensal', 'ativa', v_carencia) then
    raise exception 'Carência de 3 dias precisa valer aqui igual em avaliarAcesso().';
  end if;

  -- 2c) Cancelou hoje mas o período pago vai até o mês que vem: continua.
  if not public.assinatura_ativa_conta('mensal', 'cancelada', v_futuro) then
    raise exception 'Cancelamento não pode cortar antes do fim do período pago.';
  end if;

  -- 3) VITALÍCIO nunca é liberado NEM bloqueado por esta régua — ela é cega
  --    pra ele. Qualquer combinação de status/data tem que dar false.
  if public.assinatura_ativa_conta('vitalicio', 'ativa',      v_futuro)
     or public.assinatura_ativa_conta('vitalicio', 'cancelada', v_velho)
     or public.assinatura_ativa_conta('vitalicio', null,        null)
     or public.assinatura_ativa_conta('vitalicio', null,        v_ontem) then
    raise exception 'REGRA DE OURO VIOLADA: vitalício entrou na régua de validade.';
  end if;

  -- 4) Assinante sem validade registrada: falha nossa, libera e não pune.
  if not public.assinatura_ativa_conta('mensal', 'revisar', null) then
    raise exception 'Assinante sem valido_ate deve ser liberado (falha de dado nossa).';
  end if;

  raise notice 'OK: régua de assinatura dos módulos Plus conferida nos 4 cenários.';
end $$;
