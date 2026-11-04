-- 061_plus_manual.sql
-- PLUS CONCEDIDO À MÃO: libera todos os módulos Plus de uma conta sem venda,
-- sem assinatura e sem mexer no tipo de acesso dela.
--
-- POR QUE EXISTE
-- O botão "Conceder acesso" do admin gravava duas colunas em `usuarios`
-- (tipo_acesso='vitalicio', origem='cortesia') e nada mais. Isso dá LOGIN
-- permanente, não dá módulo Plus nenhum: Financeiro, Feedback Premiado,
-- Brindoleta e chat abrem por `assinatura_ativa()`, e essa função exige
-- `tipo_acesso = 'mensal'` na primeira condição — ou seja, devolve false para
-- todo vitalício, por construção (migration 049). Um mentorado com conta
-- própria de cortesia ficava sem o Financeiro para sempre.
--
-- A SAÍDA: UM CONCEITO, UM LUGAR
-- Em vez de escrever em cada tabela de gate (financeiro_grants por e-mail,
-- feedback_grants por e-mail, brindoleta_licenses por barbearia, chat por
-- assinatura), o Plus manual é UMA flag em `usuarios` e UMA função:
--
--     plus_ativo()  =  assinatura_ativa()  or  plus_manual_ativo()
--
-- Cada gate ganha `or public.plus_ativo()` e nada mais muda. Módulo Plus
-- futuro entra do mesmo jeito: uma linha. E revogar é um lugar só, em vez de
-- caçar linha em três tabelas.
--
-- REGRAS QUE ESTA MIGRATION NÃO QUEBRA
--   1. `tipo_acesso` não é tocado. Vitalício continua vitalício, mensal
--      continua mensal. O Plus manual é ORTOGONAL ao tipo de acesso.
--   2. `assinatura_ativa()` fica INTACTA e segue significando "assinatura paga
--      em dia". Quem lê essa função para saber de receita continua certo; o
--      conceito novo é `plus_ativo()`, que é a união das duas portas.
--   3. Tudo é `or` — ADITIVO por construção. Nenhuma condição existente foi
--      removida ou apertada, então é impossível esta migration tirar acesso de
--      alguém.
--   4. O webhook da Hotmart nunca escreve `plus_manual*`. Compra, cancelamento,
--      reembolso e expiração mexem em tipo_acesso/status/validade e nos grants
--      por e-mail — campos que o Plus manual não usa. Logo não há evento da
--      Hotmart capaz de remover uma concessão manual.
--
-- Idempotente.

-- ── 1. As colunas, em `usuarios` ───────────────────────────────────────────
-- Ficam ao lado de tipo_acesso/status_assinatura de propósito: a pergunta
-- "o que esta conta tem?" se responde lendo uma linha só.
alter table public.usuarios
  add column if not exists plus_manual        boolean not null default false,
  add column if not exists plus_manual_ate    timestamptz,
  add column if not exists plus_manual_origem text,
  add column if not exists plus_manual_por    uuid references auth.users(id) on delete set null,
  add column if not exists plus_manual_em     timestamptz;

comment on column public.usuarios.plus_manual is
  'true = todos os módulos Plus liberados à mão pelo admin, sem venda. '
  'Ortogonal a tipo_acesso: não promove nem rebaixa o tipo de acesso.';
comment on column public.usuarios.plus_manual_ate is
  'Último dia do Plus manual (inclusive, fuso São Paulo). null = sem prazo.';
comment on column public.usuarios.plus_manual_origem is
  'Por que foi concedido: manual | mentoria. Nunca ''hotmart'' — o webhook não '
  'escreve aqui.';
comment on column public.usuarios.plus_manual_por is
  'auth.users.id do admin que concedeu. Fica null se a conta do admin sumir.';
comment on column public.usuarios.plus_manual_em is
  'Quando foi concedido.';

-- Origem é lista fechada: ''hotmart'' aqui seria mentira, e um valor digitado
-- errado viraria concessão que ninguém sabe de onde veio.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'usuarios_plus_manual_origem_valida'
  ) then
    alter table public.usuarios
      add constraint usuarios_plus_manual_origem_valida
      check (plus_manual_origem is null or plus_manual_origem in ('manual', 'mentoria'));
  end if;
end $$;

-- ── 2. A régua, em três camadas (igual à da assinatura) ────────────────────
-- Função pura primeiro, pra poder ser testada sem dado nenhum.
create or replace function public.plus_manual_conta(
  p_plus_manual boolean,
  p_ate         timestamptz
)
returns boolean
language sql
-- `stable`, não `immutable`: ela lê `now()`. Marcar de immutable deixaria o
-- planejador congelar o resultado e a cortesia venceria no dia errado.
stable
as $$
  select
    coalesce(p_plus_manual, false)
    and (
      -- Sem prazo é o padrão da cortesia: ela não vence sozinha, só por
      -- revogação explícita do admin.
      p_ate is null
      -- Com prazo, o último dia VALE INTEIRO. Comparar timestamp com `now()`
      -- faria a cortesia morrer à meia-noite do fuso errado; a comparação é
      -- por DATA em São Paulo, igual ao resto do sistema.
      or (p_ate at time zone 'America/Sao_Paulo')::date
           >= (now() at time zone 'America/Sao_Paulo')::date
    );
$$;

comment on function public.plus_manual_conta(boolean, timestamptz) is
  'Régua do Plus manual: a flag está ligada e o prazo (se houver) não passou. '
  'Data no fuso América/São_Paulo, último dia inclusive.';

-- Do usuário LOGADO.
create or replace function public.plus_manual_ativo()
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
      and public.plus_manual_conta(u.plus_manual, u.plus_manual_ate)
  );
$$;

grant execute on function public.plus_manual_ativo() to authenticated;

comment on function public.plus_manual_ativo() is
  'true se o usuário logado tem Plus concedido à mão e dentro do prazo.';

-- Da BARBEARIA. Existe pelo mesmo motivo de `assinatura_ativa_barbearia`: a
-- roleta pública da Brindoleta não tem auth.uid(), e a pergunta é sobre a
-- barbearia dona do QR Code.
create or replace function public.plus_manual_barbearia(p_barbearia_id uuid)
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
      and public.plus_manual_conta(u.plus_manual, u.plus_manual_ate)
  );
$$;

comment on function public.plus_manual_barbearia(uuid) is
  'true se a barbearia tem dono com Plus concedido à mão. Caminho público da '
  'Brindoleta, onde não existe usuário logado.';

-- ── 3. O CONCEITO DE PLUS — é esta função que os gates passam a usar ───────
-- Duas portas, uma pergunta. Quem assina entra pela primeira; quem recebeu à
-- mão, pela segunda. Um módulo Plus novo só precisa de `or plus_ativo()`.
create or replace function public.plus_ativo()
returns boolean
language sql
stable
as $$
  select public.assinatura_ativa() or public.plus_manual_ativo();
$$;

grant execute on function public.plus_ativo() to authenticated;

comment on function public.plus_ativo() is
  'true se o usuário logado tem direito aos módulos Plus, por assinatura ativa '
  'OU por concessão manual do admin. É o conceito de "Plus" do sistema.';

create or replace function public.plus_ativo_barbearia(p_barbearia_id uuid)
returns boolean
language sql
stable
as $$
  select public.assinatura_ativa_barbearia(p_barbearia_id)
      or public.plus_manual_barbearia(p_barbearia_id);
$$;

grant execute on function public.plus_ativo_barbearia(uuid) to authenticated, service_role;

comment on function public.plus_ativo_barbearia(uuid) is
  'Mesma pergunta de plus_ativo(), mas sobre uma barbearia — pro caminho '
  'público da Brindoleta.';

-- ── 4. Os gates dos módulos ────────────────────────────────────────────────
-- Cada um troca `or public.assinatura_ativa()` por `or public.plus_ativo()`.
-- Como plus_ativo() JÁ CONTÉM assinatura_ativa(), nenhum assinante perde nada:
-- é a mesma porta, mais uma ao lado. O resto do corpo está idêntico ao que
-- veio das migrations 027/029/049 e 202608040001 (create or replace exige o
-- corpo completo).

-- FINANCEIRO — grant por e-mail (compra avulsa/combo) OU Plus.
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
    or public.plus_ativo();
$$;

grant execute on function public.has_financeiro() to authenticated;

comment on function public.has_financeiro() is
  'true se o usuário logado tem Financeiro: grant ativo por e-mail (compra '
  'avulsa/combo) OU Plus (assinatura ativa ou concessão manual).';

-- FEEDBACK PREMIADO — o grandfather continua inteiro: é ele que protege quem
-- comprou os R$47 antes do corte.
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
    or public.plus_ativo();
$$;

grant execute on function public.has_feedback() to authenticated;

comment on function public.has_feedback() is
  'true se o usuário logado tem Feedback de Cliente: grant ativo, OU conta '
  'criada antes de 2026-06-14 01:00 UTC (grandfather), OU Plus.';

-- BRINDOLETA — licença avulsa da barbearia OU Plus.
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
    or public.plus_ativo();
$$;

grant execute on function public.has_brindoleta() to authenticated;

comment on function public.has_brindoleta() is
  'true se o usuário logado tem Brindoleta: licença avulsa ativa da barbearia '
  'OU Plus.';

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
    or public.plus_ativo_barbearia(p_barbearia_id);
$$;

grant execute on function public.brindoleta_liberada(uuid) to authenticated, service_role;

comment on function public.brindoleta_liberada(uuid) is
  'true se a barbearia pode usar a Brindoleta: licença avulsa ativa OU Plus '
  '(dono assinante em dia ou concessão manual). Vale pro painel e pra roleta.';

-- ── 5. O chat ──────────────────────────────────────────────────────────────
-- As cinco policies da migration 050 trocam `assinatura_ativa()` por
-- `plus_ativo()`. O corpo de cada uma está idêntico no resto — inclusive o
-- `autor = 'cliente'` do insert, que é o que impede o cliente de forjar uma
-- resposta do admin dentro da conversa dele.
drop policy if exists "chat_config_leitura" on public.chat_config;
create policy "chat_config_leitura" on public.chat_config
  for select to authenticated
  using (public.plus_ativo());

drop policy if exists "chat_comunicados_leitura" on public.chat_comunicados;
create policy "chat_comunicados_leitura" on public.chat_comunicados
  for select to authenticated
  using (ativo and public.plus_ativo());

drop policy if exists "chat_leituras_marcar" on public.chat_comunicado_leituras;
create policy "chat_leituras_marcar" on public.chat_comunicado_leituras
  for insert to authenticated
  with check (usuario_id = auth.uid() and public.plus_ativo());

drop policy if exists "chat_suporte_propria_conversa" on public.chat_suporte;
create policy "chat_suporte_propria_conversa" on public.chat_suporte
  for select to authenticated
  using (usuario_id = auth.uid() and public.plus_ativo());

drop policy if exists "chat_suporte_cliente_escreve" on public.chat_suporte;
create policy "chat_suporte_cliente_escreve" on public.chat_suporte
  for insert to authenticated
  with check (usuario_id = auth.uid() and autor = 'cliente' and public.plus_ativo());

-- ── 6. Auditoria ───────────────────────────────────────────────────────────
-- Quem concedeu, para quem, o quê e quando. Só append: sem policy de update e
-- sem policy de delete, igual a `ajustes_comissao` (056) — com RLS ligada, a
-- ausência de policy é a proibição, e nem o admin reescreve o próprio log.
--
-- `conta_email` e `admin_email` ficam gravados como TEXTO, redundantes com as
-- FKs de propósito: se a conta for apagada um dia, o log tem que continuar
-- dizendo para quem o acesso foi dado.
create table if not exists public.admin_concessoes_log (
  id           uuid primary key default gen_random_uuid(),
  admin_id     uuid references auth.users(id) on delete set null,
  admin_email  text not null,
  usuario_id   uuid references auth.users(id) on delete set null,
  conta_email  text not null,
  barbearia_id uuid references public.barbearias(id) on delete set null,
  acao         text not null
    check (acao in ('conceder_acesso', 'conceder_plus', 'revogar_plus')),
  origem       text,
  expira_em    timestamptz,
  detalhe      jsonb not null default '{}'::jsonb,
  criado_em    timestamptz not null default now()
);

create index if not exists admin_concessoes_log_conta_idx
  on public.admin_concessoes_log (conta_email, criado_em desc);
create index if not exists admin_concessoes_log_data_idx
  on public.admin_concessoes_log (criado_em desc);

alter table public.admin_concessoes_log enable row level security;
-- Sem policy nenhuma: só o service_role (as actions do admin) escreve e lê.

comment on table public.admin_concessoes_log is
  'Log append-only das concessões manuais do admin. Sem update e sem delete.';

-- ── 7. Conferência — a migration falha se a regra tiver saído do lugar ─────
do $$
declare
  v_ontem    timestamptz := now() - interval '1 day';
  v_amanha   timestamptz := now() + interval '1 day';
  v_hoje     timestamptz := now();
  v_velho    timestamptz := now() - interval '30 days';
begin
  -- A) A régua do Plus manual.
  if not public.plus_manual_conta(true, null) then
    raise exception 'Plus manual sem prazo tem que valer.';
  end if;
  if not public.plus_manual_conta(true, v_amanha) then
    raise exception 'Plus manual com prazo no futuro tem que valer.';
  end if;
  if not public.plus_manual_conta(true, v_hoje) then
    raise exception 'O último dia do Plus manual vale inteiro.';
  end if;
  if public.plus_manual_conta(true, v_ontem) then
    raise exception 'Plus manual vencido ontem não pode valer.';
  end if;
  if public.plus_manual_conta(false, null) or public.plus_manual_conta(null, null) then
    raise exception 'Sem a flag ligada não existe Plus manual.';
  end if;

  -- B) A REGRA DE OURO segue de pé: a régua da ASSINATURA continua cega pro
  --    vitalício. Se esta migration tivesse encostado nela, aqui quebraria.
  if public.assinatura_ativa_conta('vitalicio', 'ativa', v_amanha)
     or public.assinatura_ativa_conta('vitalicio', null, null)
     or public.assinatura_ativa_conta('vitalicio', 'cancelada', v_velho) then
    raise exception 'REGRA DE OURO VIOLADA: vitalício entrou na régua de validade.';
  end if;

  -- C) E a assinatura continua valendo por si: nenhum assinante perde acesso
  --    por causa do conceito novo.
  if not public.assinatura_ativa_conta('mensal', 'ativa', v_amanha) then
    raise exception 'Assinante ativo perdeu a porta da assinatura.';
  end if;
  if not public.assinatura_ativa_conta('mensal', 'cancelada', v_amanha) then
    raise exception 'Cancelamento não pode cortar antes do fim do período pago.';
  end if;

  raise notice 'OK: régua do Plus manual conferida, e a da assinatura intacta.';
end $$;

-- Os gates têm que CITAR plus_ativo(), senão a concessão manual não chega a
-- eles. Confere no texto da função: é a única forma de pegar um
-- `create or replace` que tenha ficado para trás num merge.
do $$
declare
  v_falta text := '';
  v_nome  text;
begin
  foreach v_nome in array array['has_financeiro', 'has_feedback', 'has_brindoleta']
  loop
    if not exists (
      select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = v_nome
        and pg_get_functiondef(p.oid) like '%plus_ativo()%'
    ) then
      v_falta := v_falta || ' ' || v_nome;
    end if;
  end loop;

  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'brindoleta_liberada'
      and pg_get_functiondef(p.oid) like '%plus_ativo_barbearia%'
  ) then
    v_falta := v_falta || ' brindoleta_liberada';
  end if;

  if v_falta <> '' then
    raise exception '061: gate(s) sem plus_ativo():%', v_falta;
  end if;

  raise notice 'OK: Financeiro, Feedback, Brindoleta e chat reconhecem o Plus manual.';
end $$;
