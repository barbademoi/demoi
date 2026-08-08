-- 047_assinatura_estrutura.sql
-- PARTE 1 da assinatura: estrutura + backfill dos ~600 clientes VITALÍCIOS.
--
-- REGRA DE OURO (vale pro sistema inteiro)
--   tipo_acesso = 'vitalicio' → permanente. NUNCA é checado por validade ou
--                               status. Nada corta o acesso dele.
--   tipo_acesso = 'mensal'    → válido enquanto a assinatura está ativa. O
--                               anual também é 'mensal' nesse sentido; o que
--                               muda é `periodicidade` e o tamanho da validade.
--
-- As colunas novas nascem NULLABLE e sem default: pra vitalício elas ficam
-- nulas pra sempre, e um NULL em `valido_ate` nunca pode ser lido como
-- "vencido" — quem decide é o tipo_acesso, não a data.
--
-- O DEFAULT 'vitalicio' DE tipo_acesso CONTINUA AQUI DE PROPÓSITO. Removê-lo
-- antes do webhook novo estar no ar quebraria a criação de conta: a coluna é
-- NOT NULL, e os inserts que hoje não informam tipo_acesso passariam a falhar.
-- A remoção fica na migration 048, pra rodar DEPOIS do deploy.
--
-- CONFERÊNCIA: a contagem apurada em produção antes desta migration foi 598,
-- todos vitalícios. Se o total não bater no fim, a migration LEVANTA EXCEÇÃO e
-- desfaz tudo — melhor falhar do que deixar o banco num estado que ninguém
-- conferiu.

-- ── 1. Colunas da assinatura ───────────────────────────────────────────────
alter table public.usuarios
  add column if not exists status_assinatura text,
  add column if not exists valido_ate        timestamptz,
  add column if not exists periodicidade     text,
  add column if not exists assinatura_id     text;

comment on column public.usuarios.status_assinatura is
  'Só pra tipo_acesso=mensal: ativa | atrasada | cancelada | revisar. NULL em vitalício.';
comment on column public.usuarios.valido_ate is
  'Só pra tipo_acesso=mensal: até quando o acesso vale. NULL em vitalício — e NULL nunca significa vencido.';
comment on column public.usuarios.periodicidade is
  'Só pra tipo_acesso=mensal: mensal | anual. Define o tamanho da renovação.';
comment on column public.usuarios.assinatura_id is
  'Código do assinante na Hotmart (subscriber code). Chave pra casar eventos de renovação/cancelamento.';

create index if not exists idx_usuarios_assinatura on public.usuarios (assinatura_id)
  where assinatura_id is not null;

-- ── 2. Backfill: todo mundo que existe hoje é VITALÍCIO ────────────────────
update public.usuarios
   set tipo_acesso = 'vitalicio'
 where tipo_acesso is distinct from 'mensal';

-- ── 3. Domínio fechado, pra não entrar valor solto por engano ──────────────
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'usuarios_tipo_acesso_valido') then
    alter table public.usuarios
      add constraint usuarios_tipo_acesso_valido
      check (tipo_acesso in ('vitalicio', 'mensal'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'usuarios_periodicidade_valida') then
    alter table public.usuarios
      add constraint usuarios_periodicidade_valida
      check (periodicidade is null or periodicidade in ('mensal', 'anual'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'usuarios_status_assinatura_valido') then
    alter table public.usuarios
      add constraint usuarios_status_assinatura_valido
      check (status_assinatura is null or status_assinatura in ('ativa', 'atrasada', 'cancelada', 'revisar'));
  end if;
end $$;

-- ── 4. Idempotência dos eventos da Hotmart ─────────────────────────────────
-- Todo evento v2 traz um `id` único. Guardar o que já foi processado é o que
-- impede uma retentativa da Hotmart de estender `valido_ate` duas vezes.
create table if not exists public.hotmart_eventos_processados (
  evento_id    text primary key,
  evento       text,
  assinatura_id text,
  processado_em timestamptz not null default now()
);
alter table public.hotmart_eventos_processados enable row level security;
-- Sem policies: só o service_role (webhook) escreve e lê.

comment on table public.hotmart_eventos_processados is
  'Eventos da Hotmart já processados, pra retentativa não renovar assinatura duas vezes.';

-- ── 5. Conferência final — falha se não bater ──────────────────────────────
do $$
declare
  v_total     int;
  v_vitalicio int;
  v_mensal    int;
  v_esperado  int := 598;   -- apurado em produção antes desta migration
begin
  select count(*) into v_total     from public.usuarios;
  select count(*) into v_vitalicio from public.usuarios where tipo_acesso = 'vitalicio';
  select count(*) into v_mensal    from public.usuarios where tipo_acesso = 'mensal';

  raise notice 'total=% vitalicio=% mensal=%', v_total, v_vitalicio, v_mensal;

  if v_vitalicio <> v_total then
    raise exception 'Backfill inconsistente: % de % usuários ficaram sem vitalicio.', v_total - v_vitalicio, v_total;
  end if;

  -- Tolera diferença pequena (contas criadas entre a contagem e a migration),
  -- mas trava se o número fugir do esperado — aí alguém mexeu no meio.
  if abs(v_total - v_esperado) > 5 then
    raise exception 'Total de usuários (%) muito diferente do esperado (%). Confira antes de seguir.', v_total, v_esperado;
  end if;

  raise notice 'OK: os % usuários existentes estão como vitalicio.', v_total;
end $$;
