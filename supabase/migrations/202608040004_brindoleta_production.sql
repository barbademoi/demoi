-- Reforço final para produção: limita abuso por rede sem armazenar IP bruto.
-- O cookie continua aplicando um giro por aparelho/dia; a impressão HMAC cria
-- uma segunda barreira de velocidade por empresa/rede para impedir automação
-- sem bloquear o movimento normal de um estabelecimento ao longo do dia.

alter table public.brindoleta_spins
  add column if not exists network_fingerprint text;

create index if not exists brindoleta_spins_network_day_idx
  on public.brindoleta_spins(barbearia_id, day_key, network_fingerprint)
  where network_fingerprint is not null;

create or replace function public.create_brindoleta_spin(
  p_barbearia_id uuid,
  p_barbeiro_id uuid,
  p_offer_id uuid,
  p_offer_title text,
  p_benefit text,
  p_offer_type text,
  p_offer_color text,
  p_amount_cents integer,
  p_client_token text,
  p_network_fingerprint text,
  p_day_key date
)
returns table(status text, spin_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing uuid;
  v_spin_id uuid;
  v_network_recent bigint;
  v_network_day bigint;
begin
  -- Serializa tentativas da mesma rede/empresa/dia para que o limite também
  -- seja respeitado quando várias requisições chegam ao mesmo tempo.
  perform pg_advisory_xact_lock(hashtextextended(
    p_barbearia_id::text || ':' || p_day_key::text || ':' || p_network_fingerprint,
    0
  ));

  select id into v_existing
    from public.brindoleta_spins
   where barbearia_id = p_barbearia_id
     and client_token = p_client_token
     and day_key = p_day_key
   limit 1;

  if found then
    return query select 'already_spun'::text, v_existing;
    return;
  end if;

  select count(*) filter (where created_at >= now() - interval '10 minutes'),
         count(*)
    into v_network_recent, v_network_day
    from public.brindoleta_spins
   where barbearia_id = p_barbearia_id
     and day_key = p_day_key
     and network_fingerprint = p_network_fingerprint;

  if v_network_recent >= 20 or v_network_day >= 500 then
    return query select 'network_limited'::text, null::uuid;
    return;
  end if;

  insert into public.brindoleta_spins (
    barbearia_id, barbeiro_id, offer_id, offer_title, benefit, offer_type,
    offer_color, amount_cents, client_token, network_fingerprint, day_key
  ) values (
    p_barbearia_id, p_barbeiro_id, p_offer_id, p_offer_title, p_benefit,
    p_offer_type, p_offer_color, p_amount_cents, p_client_token,
    p_network_fingerprint, p_day_key
  ) returning id into v_spin_id;

  return query select 'ok'::text, v_spin_id;
exception
  when unique_violation then
    return query select 'already_spun'::text, null::uuid;
end;
$$;

revoke all on function public.create_brindoleta_spin(
  uuid, uuid, uuid, text, text, text, text, integer, text, text, date
) from public;
grant execute on function public.create_brindoleta_spin(
  uuid, uuid, uuid, text, text, text, text, integer, text, text, date
) to service_role;

comment on column public.brindoleta_spins.network_fingerprint is
  'HMAC anônimo da rede, usado somente para proteção contra abuso; nenhum IP bruto é salvo.';
