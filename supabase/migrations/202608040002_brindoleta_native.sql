-- Brindoleta nativa no BarberMeta.
-- O projeto original da Brindoleta permanece independente; estas tabelas
-- armazenam apenas as campanhas das empresas licenciadas no BarberMeta.

create table if not exists public.brindoleta_offers (
  id uuid primary key default uuid_generate_v4(),
  barbearia_id uuid not null references public.barbearias(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 50),
  benefit text not null check (char_length(benefit) between 2 and 140),
  offer_type text not null check (offer_type in ('Serviço', 'Produto', 'Brinde')),
  chance integer not null default 10 check (chance between 1 and 100),
  stock integer not null default 1 check (stock between 0 and 99999),
  revenue_cents integer not null default 0 check (revenue_cents between 0 and 100000000),
  color text not null default '#d8ff00' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brindoleta_spins (
  id uuid primary key default uuid_generate_v4(),
  barbearia_id uuid not null references public.barbearias(id) on delete cascade,
  barbeiro_id uuid not null references public.barbeiros(id) on delete cascade,
  offer_id uuid references public.brindoleta_offers(id) on delete set null,
  client_token text not null check (char_length(client_token) between 16 and 100),
  day_key date not null,
  created_at timestamptz not null default now(),
  unique (barbearia_id, client_token, day_key)
);

create table if not exists public.brindoleta_sales (
  id uuid primary key default uuid_generate_v4(),
  spin_id uuid unique not null references public.brindoleta_spins(id) on delete cascade,
  barbearia_id uuid not null references public.barbearias(id) on delete cascade,
  barbeiro_id uuid not null references public.barbeiros(id) on delete cascade,
  offer_id uuid references public.brindoleta_offers(id) on delete set null,
  customer_name text not null check (char_length(customer_name) between 2 and 80),
  offer_title text not null,
  benefit text not null,
  amount_cents integer not null default 0 check (amount_cents between 0 and 100000000),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists brindoleta_offers_barbearia_idx
  on public.brindoleta_offers(barbearia_id, enabled, created_at);
create index if not exists brindoleta_spins_barbearia_idx
  on public.brindoleta_spins(barbearia_id, created_at desc);
create index if not exists brindoleta_sales_barbearia_idx
  on public.brindoleta_sales(barbearia_id, status, created_at desc);

-- Decisão e ajuste de estoque acontecem na mesma transação para impedir
-- confirmação duplicada ou divergência quando dois cliques chegam juntos.
create or replace function public.decide_brindoleta_sale(
  p_sale_id uuid,
  p_barbearia_id uuid,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer_id uuid;
begin
  if p_status not in ('confirmed', 'rejected') then
    return false;
  end if;

  update public.brindoleta_sales
     set status = p_status,
         decided_at = now()
   where id = p_sale_id
     and barbearia_id = p_barbearia_id
     and status = 'pending'
  returning offer_id into v_offer_id;

  if not found then
    return false;
  end if;

  if p_status = 'confirmed' and v_offer_id is not null then
    update public.brindoleta_offers
       set stock = greatest(stock - 1, 0),
           enabled = (stock - 1) > 0,
           updated_at = now()
     where id = v_offer_id
       and barbearia_id = p_barbearia_id;
  end if;

  return true;
end;
$$;

-- Ao excluir uma venda confirmada, devolve a unidade ao estoque.
create or replace function public.delete_brindoleta_sale(
  p_sale_id uuid,
  p_barbearia_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer_id uuid;
  v_status text;
begin
  select offer_id, status
    into v_offer_id, v_status
    from public.brindoleta_sales
   where id = p_sale_id
     and barbearia_id = p_barbearia_id
   for update;

  if not found then
    return false;
  end if;

  delete from public.brindoleta_sales
   where id = p_sale_id
     and barbearia_id = p_barbearia_id;

  if v_status = 'confirmed' and v_offer_id is not null then
    update public.brindoleta_offers
       set stock = stock + 1,
           enabled = case when stock = 0 then true else enabled end,
           updated_at = now()
     where id = v_offer_id
       and barbearia_id = p_barbearia_id;
  end if;

  return true;
end;
$$;

revoke all on function public.decide_brindoleta_sale(uuid, uuid, text) from public;
revoke all on function public.delete_brindoleta_sale(uuid, uuid) from public;
grant execute on function public.decide_brindoleta_sale(uuid, uuid, text) to service_role;
grant execute on function public.delete_brindoleta_sale(uuid, uuid) to service_role;

drop trigger if exists brindoleta_offers_updated_at on public.brindoleta_offers;
create trigger brindoleta_offers_updated_at
  before update on public.brindoleta_offers
  for each row execute function public.set_updated_at();

alter table public.brindoleta_offers enable row level security;
alter table public.brindoleta_spins enable row level security;
alter table public.brindoleta_sales enable row level security;

drop policy if exists "dono_gerencia_ofertas_brindoleta" on public.brindoleta_offers;
create policy "dono_gerencia_ofertas_brindoleta"
  on public.brindoleta_offers
  for all
  to authenticated
  using (barbearia_id = public.get_barbearia_id() and public.has_brindoleta())
  with check (barbearia_id = public.get_barbearia_id() and public.has_brindoleta());

drop policy if exists "dono_le_giros_brindoleta" on public.brindoleta_spins;
create policy "dono_le_giros_brindoleta"
  on public.brindoleta_spins
  for select
  to authenticated
  using (barbearia_id = public.get_barbearia_id() and public.has_brindoleta());

drop policy if exists "dono_le_vendas_brindoleta" on public.brindoleta_sales;
create policy "dono_le_vendas_brindoleta"
  on public.brindoleta_sales
  for select
  to authenticated
  using (barbearia_id = public.get_barbearia_id() and public.has_brindoleta());

-- Gravações públicas e decisões de venda passam por Server Actions validadas.
revoke insert, update, delete on public.brindoleta_spins from authenticated, anon;
revoke insert, update, delete on public.brindoleta_sales from authenticated, anon;
grant select, insert, update, delete on public.brindoleta_offers to authenticated;
grant select on public.brindoleta_spins to authenticated;
grant select on public.brindoleta_sales to authenticated;

comment on table public.brindoleta_offers is 'Ofertas configuradas sem código pelo dono dentro do BarberMeta.';
comment on table public.brindoleta_spins is 'Giros públicos identificados pelo QR do colaborador e limitados por aparelho/dia.';
comment on table public.brindoleta_sales is 'Ofertas aceitas pelo cliente e confirmadas ou recusadas pelo dono.';
