-- Bússola — Tabela pra guardar payload bruto de TODO webhook recebido,
-- antes de qualquer processamento. Garante que nenhuma compra se perca
-- mesmo se a lógica de processamento quebrar.

create table if not exists webhooks_recebidos (
  id uuid primary key default gen_random_uuid(),
  origem text not null,
  event text,
  payload jsonb not null,
  hottok_valido boolean,
  processado boolean not null default false,
  erro_processamento text,
  tentativas int not null default 0,
  ultima_tentativa_em timestamptz,
  recebido_em timestamptz not null default now(),
  processado_em timestamptz
);

create index if not exists idx_webhooks_origem_processado
  on webhooks_recebidos(origem, processado);

create index if not exists idx_webhooks_event
  on webhooks_recebidos(event);

create index if not exists idx_webhooks_recebido_em
  on webhooks_recebidos(recebido_em desc);

-- RLS: ninguém via PostgREST direto. Só service role acessa (webhook +
-- página admin server-side com createAdminClient).
alter table webhooks_recebidos enable row level security;
