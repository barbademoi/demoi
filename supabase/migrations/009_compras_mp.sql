create table if not exists compras_pendentes (
  id                uuid        primary key default gen_random_uuid(),
  email             text        not null,
  nome              text        not null,
  telefone          text,
  mp_preference_id  text,
  mp_payment_id     text,
  status            text        default 'pending'
                    check (status in ('pending','approved','rejected','refunded')),
  valor             numeric(10,2) default 47.00,
  usuario_id        uuid        references auth.users(id),
  created_at        timestamptz default now(),
  approved_at       timestamptz
);

create index if not exists idx_compras_email      on compras_pendentes(email);
create index if not exists idx_compras_payment_id on compras_pendentes(mp_payment_id);
create index if not exists idx_compras_status     on compras_pendentes(status, approved_at);

alter table compras_pendentes enable row level security;

create policy "admin_le_compras" on compras_pendentes
  for select to authenticated
  using (
    exists (select 1 from usuarios where id = auth.uid() and role = 'admin')
  );
