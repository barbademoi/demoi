-- Bússola — Integração Hotmart
-- Rastreia compras + permite desativar estabelecimento em refund.

-- 1) Coluna ativo em estabelecimentos (refund desativa, não apaga).
alter table estabelecimentos
  add column if not exists ativo boolean not null default true;

create index if not exists idx_estabelecimentos_ativo
  on estabelecimentos(ativo) where ativo = false;

-- 2) Tabela de compras Hotmart pra idempotência + auditoria.
create table if not exists compras_hotmart (
  id uuid primary key default gen_random_uuid(),
  transaction_id text unique not null,
  email_comprador text not null,
  nome_comprador text,
  produto_id text not null,
  valor_pago numeric(10, 2),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'refunded', 'failed', 'canceled')),
  usuario_id uuid references auth.users(id) on delete set null,
  estabelecimento_id uuid references estabelecimentos(id) on delete set null,
  raw_payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_compras_email
  on compras_hotmart(email_comprador);

create index if not exists idx_compras_transaction
  on compras_hotmart(transaction_id);

create index if not exists idx_compras_status
  on compras_hotmart(status);

-- 3) Trigger pra atualizar updated_at automaticamente.
create or replace function update_compras_hotmart_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_compras_hotmart_updated_at on compras_hotmart;
create trigger trg_compras_hotmart_updated_at
  before update on compras_hotmart
  for each row execute function update_compras_hotmart_updated_at();

-- 4) RLS — apenas service role lê/escreve (webhook).
-- Donos não precisam ler isso direto; é dado interno.
alter table compras_hotmart enable row level security;

-- Sem policy → ninguém via PostgREST consegue acessar. Só service role
-- (que ignora RLS) consegue, que é exatamente o webhook.
