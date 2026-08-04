-- Compatibilidade para ambientes que aplicaram a migration nativa antes do
-- endurecimento do fluxo. Preserva o prêmio sorteado e reserva estoque no aceite.

alter table public.brindoleta_spins add column if not exists offer_title text;
alter table public.brindoleta_spins add column if not exists benefit text;
alter table public.brindoleta_spins add column if not exists offer_type text;
alter table public.brindoleta_spins add column if not exists offer_color text;
alter table public.brindoleta_spins add column if not exists amount_cents integer default 0;

update public.brindoleta_spins s
   set offer_title = coalesce(s.offer_title, o.title, 'Oferta'),
       benefit = coalesce(s.benefit, o.benefit, 'Benefício registrado'),
       offer_type = coalesce(s.offer_type, o.offer_type, 'Brinde'),
       offer_color = coalesce(s.offer_color, o.color, '#d8ff00'),
       amount_cents = coalesce(s.amount_cents, o.revenue_cents, 0)
  from public.brindoleta_offers o
 where o.id = s.offer_id;

update public.brindoleta_spins
   set offer_title = coalesce(offer_title, 'Oferta'),
       benefit = coalesce(benefit, 'Benefício registrado'),
       offer_type = coalesce(offer_type, 'Brinde'),
       offer_color = coalesce(offer_color, '#d8ff00'),
       amount_cents = coalesce(amount_cents, 0);

alter table public.brindoleta_spins alter column offer_title set not null;
alter table public.brindoleta_spins alter column benefit set not null;
alter table public.brindoleta_spins alter column offer_type set not null;
alter table public.brindoleta_spins alter column offer_color set not null;
alter table public.brindoleta_spins alter column amount_cents set not null;

create or replace function public.accept_brindoleta_prize(
  p_spin_id uuid,
  p_barbearia_id uuid,
  p_barbeiro_id uuid,
  p_client_token text,
  p_customer_name text,
  p_day_key date
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_spin public.brindoleta_spins%rowtype;
  v_stock integer;
  v_pending bigint;
begin
  select * into v_spin
    from public.brindoleta_spins
   where id = p_spin_id
     and barbearia_id = p_barbearia_id
     and barbeiro_id = p_barbeiro_id
     and client_token = p_client_token
     and day_key = p_day_key;

  if not found then return 'invalid'; end if;
  if exists (select 1 from public.brindoleta_sales where spin_id = p_spin_id) then
    return 'existing';
  end if;

  select stock into v_stock
    from public.brindoleta_offers
   where id = v_spin.offer_id
     and barbearia_id = p_barbearia_id
   for update;

  if not found then return 'unavailable'; end if;

  select count(*) into v_pending
    from public.brindoleta_sales
   where offer_id = v_spin.offer_id
     and barbearia_id = p_barbearia_id
     and status = 'pending';

  if v_stock <= v_pending then return 'unavailable'; end if;

  insert into public.brindoleta_sales (
    spin_id, barbearia_id, barbeiro_id, offer_id, customer_name,
    offer_title, benefit, amount_cents, status
  ) values (
    v_spin.id, v_spin.barbearia_id, v_spin.barbeiro_id, v_spin.offer_id,
    p_customer_name, v_spin.offer_title, v_spin.benefit, v_spin.amount_cents, 'pending'
  );

  return 'ok';
exception
  when unique_violation then return 'existing';
end;
$$;

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
  if p_status not in ('confirmed', 'rejected') then return false; end if;

  select offer_id into v_offer_id
    from public.brindoleta_sales
   where id = p_sale_id
     and barbearia_id = p_barbearia_id
     and status = 'pending'
   for update;

  if not found then return false; end if;

  if p_status = 'confirmed' and v_offer_id is not null then
    update public.brindoleta_offers
       set stock = greatest(stock - 1, 0),
           updated_at = now()
     where id = v_offer_id
       and barbearia_id = p_barbearia_id
       and stock > 0;
    if not found then return false; end if;
  end if;

  update public.brindoleta_sales
     set status = p_status,
         decided_at = now()
   where id = p_sale_id
     and barbearia_id = p_barbearia_id
     and status = 'pending';

  return true;
end;
$$;

revoke all on function public.accept_brindoleta_prize(uuid, uuid, uuid, text, text, date) from public;
revoke all on function public.decide_brindoleta_sale(uuid, uuid, text) from public;
grant execute on function public.accept_brindoleta_prize(uuid, uuid, uuid, text, text, date) to service_role;
grant execute on function public.decide_brindoleta_sale(uuid, uuid, text) to service_role;
