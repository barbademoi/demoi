-- =====================================================================
-- MDC — Método Demôi de Crescimento
-- FASE 1 — Lista de espera
--
-- Rode no SQL Editor do Supabase (projeto NOVO, só do MDC).
-- Pode rodar de novo sem quebrar: tudo é "if not exists" / "or replace".
-- =====================================================================

-- ---------------------------------------------------------------------
-- Admins
-- Quem está nesta tabela tem acesso total ao /admin.
-- Para virar admin: crie o usuário em Authentication → Users e rode
--   insert into public.mdc_admins (user_id)
--   select id from auth.users where email = 'SEU-EMAIL' on conflict do nothing;
-- ---------------------------------------------------------------------
create table if not exists public.mdc_admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.mdc_admins enable row level security;

create or replace function public.mdc_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.mdc_admins where user_id = auth.uid());
$$;
revoke all on function public.mdc_is_admin() from public;
grant execute on function public.mdc_is_admin() to anon, authenticated, service_role;

drop policy if exists mdc_admins_select_self on public.mdc_admins;
create policy mdc_admins_select_self on public.mdc_admins
  for select using (user_id = auth.uid() or public.mdc_is_admin());

-- "Hoje" sempre no horário de Brasília (o servidor do Supabase roda em UTC).
create or replace function public.mdc_hoje()
returns date
language sql
stable
as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;

-- ---------------------------------------------------------------------
-- Configurações (textos editáveis, links, chave Pix...)
-- visibilidade:
--   public → qualquer visitante lê (textos da página, link do grupo de espera)
--   auth   → qualquer usuário logado (dados de pagamento, usados na compra)
--   member → membro ativo (links do Meet, grupo, BarberMeta, Tarefix) — fase 3
--   admin  → só admin (modelos de mensagem do WhatsApp)
-- ---------------------------------------------------------------------
create table if not exists public.mdc_settings (
  key          text primary key,
  value        jsonb not null default '{}'::jsonb,
  visibilidade text not null default 'admin'
               check (visibilidade in ('public', 'auth', 'member', 'admin')),
  updated_at   timestamptz not null default now()
);
alter table public.mdc_settings enable row level security;

drop policy if exists mdc_settings_select on public.mdc_settings;
create policy mdc_settings_select on public.mdc_settings
  for select using (
    visibilidade = 'public'
    or (visibilidade = 'auth' and auth.uid() is not null)
    or public.mdc_is_admin()
  );
-- (a fase 3 troca esta policy por uma que também libera 'member')

drop policy if exists mdc_settings_admin_all on public.mdc_settings;
create policy mdc_settings_admin_all on public.mdc_settings
  for all using (public.mdc_is_admin()) with check (public.mdc_is_admin());

-- ---------------------------------------------------------------------
-- Leads (lista de espera)
-- ---------------------------------------------------------------------
create table if not exists public.mdc_leads (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- obrigatórios
  nome             text not null check (char_length(nome) between 2 and 120),
  whatsapp         text not null check (whatsapp ~ '^[0-9]{10,13}$'),  -- só dígitos, com DDD
  cidade           text not null check (char_length(cidade) between 2 and 120),
  uf               text not null check (uf ~ '^[A-Z]{2}$'),
  perfil           text not null check (perfil in ('sozinho', 'equipe')),
  disposicao       text not null check (disposicao in ('sim', 'organizar', 'entender', 'nao')),
  autoriza_contato boolean not null check (autoriza_contato = true),

  -- opcionais
  instagram        text check (instagram is null or char_length(instagram) <= 80),
  num_barbeiros    int  check (num_barbeiros is null or num_barbeiros between 1 and 200),
  faturamento      text check (faturamento is null or faturamento in ('ate10', '10a20', '20a40', '40a60', '60mais')),
  dor              text check (dor is null or dor in ('equipe', 'rotina', 'numeros', 'preco', 'agenda', 'clientes', 'assinatura', 'tempo', 'outro')),
  dor_outro        text check (dor_outro is null or char_length(dor_outro) <= 300),
  origem           text check (origem is null or origem in ('instagram', 'indicacao', 'mentorado', 'outro')),
  utm              jsonb,

  -- controle do admin
  status           text not null default 'novo'
                   check (status in ('novo', 'contatado', 'comprou', 'descartado')),
  notas            text
);

create index if not exists mdc_leads_created_idx on public.mdc_leads (created_at desc);
create index if not exists mdc_leads_status_idx  on public.mdc_leads (status);
create index if not exists mdc_leads_whatsapp_idx on public.mdc_leads (whatsapp);

alter table public.mdc_leads enable row level security;

-- Visitante só INSERE (e só com status 'novo' e sem notas). Não lê nada.
drop policy if exists mdc_leads_insert_public on public.mdc_leads;
create policy mdc_leads_insert_public on public.mdc_leads
  for insert to anon, authenticated
  with check (status = 'novo' and notas is null);

drop policy if exists mdc_leads_admin_all on public.mdc_leads;
create policy mdc_leads_admin_all on public.mdc_leads
  for all using (public.mdc_is_admin()) with check (public.mdc_is_admin());

-- updated_at automático
create or replace function public.mdc_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists mdc_leads_touch on public.mdc_leads;
create trigger mdc_leads_touch before update on public.mdc_leads
  for each row execute function public.mdc_touch_updated_at();

drop trigger if exists mdc_settings_touch on public.mdc_settings;
create trigger mdc_settings_touch before update on public.mdc_settings
  for each row execute function public.mdc_touch_updated_at();

-- ---------------------------------------------------------------------
-- Configurações iniciais da fase 1 (os textos padrão ficam no código;
-- aqui só criamos as linhas com a visibilidade certa).
-- ---------------------------------------------------------------------
insert into public.mdc_settings (key, value, visibilidade) values
  ('landing',          '{}'::jsonb, 'public'),
  ('grupo_espera_url', '""'::jsonb, 'public'),
  ('msg_lead',         '""'::jsonb, 'admin')
on conflict (key) do nothing;
