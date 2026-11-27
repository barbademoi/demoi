-- =====================================================================
-- MDC — FASE 2 — Vendas, pagamento manual, diagnóstico, vencimentos
-- Rode depois do 001. Pode rodar de novo.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Membros (1 linha por conta de comprador, ligada ao auth.users)
-- status guardado:
--   pendente   → conta criada, ainda não mandou comprovante
--   aguardando → mandou comprovante, falta o admin confirmar
--   ativo      → pagamento confirmado (vencido/vence em breve são calculados
--                pela data de vencimento, não ficam guardados)
--   cancelado  → desligado pelo admin
-- ---------------------------------------------------------------------
create table if not exists public.mdc_members (
  id           uuid primary key references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  nome         text not null,
  email        text not null,
  whatsapp     text not null,
  plano        text not null check (plano in ('semestral_cartao', 'semestral_pix', 'mensal_pix')),
  status       text not null default 'pendente'
               check (status in ('pendente', 'aguardando', 'ativo', 'cancelado')),
  data_inicio  date,
  vencimento   date,
  perfil       text check (perfil in ('sozinho', 'equipe')),
  cidade       text,
  uf           text,
  fundador     boolean not null default false,   -- turma de 18/01/2027
  convidado    boolean not null default false,   -- mentorado convidado
  observacao   text
);
create index if not exists mdc_members_venc_idx on public.mdc_members (vencimento);
create index if not exists mdc_members_status_idx on public.mdc_members (status);

alter table public.mdc_members enable row level security;

drop trigger if exists mdc_members_touch on public.mdc_members;
create trigger mdc_members_touch before update on public.mdc_members
  for each row execute function public.mdc_touch_updated_at();

-- Membro só LÊ a própria linha. Toda escrita passa pelo servidor (service
-- role) depois de conferir quem é — assim ninguém se dá "ativo" sozinho.
drop policy if exists mdc_members_select_own on public.mdc_members;
create policy mdc_members_select_own on public.mdc_members
  for select using (id = auth.uid() or public.mdc_is_admin());

drop policy if exists mdc_members_admin_all on public.mdc_members;
create policy mdc_members_admin_all on public.mdc_members
  for all using (public.mdc_is_admin()) with check (public.mdc_is_admin());

-- Membro com acesso liberado: ativo e dentro do vencimento (o dia do
-- vencimento ainda vale).
create or replace function public.mdc_is_active_member(p_uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.mdc_members
    -- só sobre si mesmo (ou admin): ninguém consulta o status de outro membro
    where id = p_uid and (p_uid = auth.uid() or public.mdc_is_admin()) and status = 'ativo'
      and vencimento is not null and vencimento >= public.mdc_hoje()
  );
$$;
-- anon pode chamar (usado dentro das policies): para quem não está logado a resposta é sempre falso/vazio.
revoke all on function public.mdc_is_active_member(uuid) from public;
grant execute on function public.mdc_is_active_member(uuid) to anon, authenticated, service_role;

-- Semana do membro = semanas completas desde o início + 1.
create or replace function public.mdc_member_week(p_uid uuid default auth.uid())
returns int
language sql
stable
security definer
set search_path = public
as $$
  select case when data_inicio is null or data_inicio > public.mdc_hoje() then 0
              else ((public.mdc_hoje() - data_inicio) / 7) + 1 end
  from public.mdc_members where id = p_uid and (p_uid = auth.uid() or public.mdc_is_admin());
$$;
-- anon pode chamar (usado dentro das policies): para quem não está logado a resposta é sempre falso/vazio.
revoke all on function public.mdc_member_week(uuid) from public;
grant execute on function public.mdc_member_week(uuid) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- Pagamentos
-- ---------------------------------------------------------------------
create table if not exists public.mdc_payments (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  member_id        uuid not null references public.mdc_members (id) on delete cascade,
  plano            text not null check (plano in ('semestral_cartao', 'semestral_pix', 'mensal_pix')),
  comprovante_path text,
  status           text not null default 'enviado' check (status in ('enviado', 'confirmado', 'recusado')),
  valor            numeric(10, 2),
  forma            text check (forma in ('cartao', 'pix', 'dinheiro', 'outro')),
  pago_em          date,
  periodo_inicio   date,
  periodo_fim      date,
  confirmado_em    timestamptz,
  confirmado_por   uuid references auth.users (id),
  observacao       text
);
create index if not exists mdc_payments_member_idx on public.mdc_payments (member_id, created_at desc);
create index if not exists mdc_payments_status_idx on public.mdc_payments (status);

alter table public.mdc_payments enable row level security;

drop policy if exists mdc_payments_select_own on public.mdc_payments;
create policy mdc_payments_select_own on public.mdc_payments
  for select using (member_id = auth.uid() or public.mdc_is_admin());

-- Membro só cria "enviado", sem valor nem confirmação.
drop policy if exists mdc_payments_insert_own on public.mdc_payments;
create policy mdc_payments_insert_own on public.mdc_payments
  for insert to authenticated
  with check (
    member_id = auth.uid() and status = 'enviado' and valor is null
    and confirmado_em is null and confirmado_por is null
    and periodo_inicio is null and periodo_fim is null
  );

drop policy if exists mdc_payments_admin_all on public.mdc_payments;
create policy mdc_payments_admin_all on public.mdc_payments
  for all using (public.mdc_is_admin()) with check (public.mdc_is_admin());

-- ---------------------------------------------------------------------
-- Aceite do termo de adesão (data, hora e versão)
-- ---------------------------------------------------------------------
create table if not exists public.mdc_terms_acceptances (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.mdc_members (id) on delete cascade,
  versao      text not null,
  aceito_em   timestamptz not null default now(),
  ip          text,
  user_agent  text
);
create index if not exists mdc_terms_member_idx on public.mdc_terms_acceptances (member_id);
alter table public.mdc_terms_acceptances enable row level security;

drop policy if exists mdc_terms_select_own on public.mdc_terms_acceptances;
create policy mdc_terms_select_own on public.mdc_terms_acceptances
  for select using (member_id = auth.uid() or public.mdc_is_admin());
drop policy if exists mdc_terms_admin_all on public.mdc_terms_acceptances;
create policy mdc_terms_admin_all on public.mdc_terms_acceptances
  for all using (public.mdc_is_admin()) with check (public.mdc_is_admin());

-- ---------------------------------------------------------------------
-- Diagnósticos (entrada e reavaliação de 90 dias)
-- As respostas ficam em JSON: dá pra mudar pergunta sem migração.
-- ---------------------------------------------------------------------
create table if not exists public.mdc_diagnosticos (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  member_id   uuid not null references public.mdc_members (id) on delete cascade,
  tipo        text not null check (tipo in ('entrada', '90dias')),
  respostas   jsonb not null,
  unique (member_id, tipo)
);
alter table public.mdc_diagnosticos enable row level security;

drop policy if exists mdc_diag_select_own on public.mdc_diagnosticos;
create policy mdc_diag_select_own on public.mdc_diagnosticos
  for select using (member_id = auth.uid() or public.mdc_is_admin());
drop policy if exists mdc_diag_admin_all on public.mdc_diagnosticos;
create policy mdc_diag_admin_all on public.mdc_diagnosticos
  for all using (public.mdc_is_admin()) with check (public.mdc_is_admin());
-- (gravação pelo servidor, depois de conferir que o membro está ativo)

-- ---------------------------------------------------------------------
-- Página de vendas: resultados de mentorados e perguntas frequentes
-- ---------------------------------------------------------------------
create table if not exists public.mdc_testimonials (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nome       text not null,
  local      text,            -- "Barbearia X · Cidade-UF"
  texto      text not null,
  foto_url   text,
  ordem      int not null default 0,
  ativo      boolean not null default true
);
alter table public.mdc_testimonials enable row level security;
drop policy if exists mdc_testimonials_public on public.mdc_testimonials;
create policy mdc_testimonials_public on public.mdc_testimonials for select using (ativo or public.mdc_is_admin());
drop policy if exists mdc_testimonials_admin on public.mdc_testimonials;
create policy mdc_testimonials_admin on public.mdc_testimonials
  for all using (public.mdc_is_admin()) with check (public.mdc_is_admin());

create table if not exists public.mdc_faqs (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  pergunta   text not null,
  resposta   text not null,
  ordem      int not null default 0,
  ativo      boolean not null default true
);
alter table public.mdc_faqs enable row level security;
drop policy if exists mdc_faqs_public on public.mdc_faqs;
create policy mdc_faqs_public on public.mdc_faqs for select using (ativo or public.mdc_is_admin());
drop policy if exists mdc_faqs_admin on public.mdc_faqs;
create policy mdc_faqs_admin on public.mdc_faqs
  for all using (public.mdc_is_admin()) with check (public.mdc_is_admin());

-- ---------------------------------------------------------------------
-- Storage
--   comprovantes → PRIVADO. Cada membro sobe só na pasta com o próprio id.
--                  Leitura: dono ou admin (o admin vê por link assinado).
--   publico      → público: QR Code do Pix e fotos dos resultados.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mdc-comprovantes', 'mdc-comprovantes', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'])
on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mdc-publico', 'mdc-publico', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
on conflict (id) do update set public = true;

drop policy if exists mdc_comprovantes_insert_own on storage.objects;
create policy mdc_comprovantes_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'mdc-comprovantes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists mdc_comprovantes_select on storage.objects;
create policy mdc_comprovantes_select on storage.objects
  for select to authenticated
  using (bucket_id = 'mdc-comprovantes' and ((storage.foldername(name))[1] = auth.uid()::text or public.mdc_is_admin()));

drop policy if exists mdc_publico_admin_write on storage.objects;
create policy mdc_publico_admin_write on storage.objects
  for all to authenticated
  using (bucket_id = 'mdc-publico' and public.mdc_is_admin())
  with check (bucket_id = 'mdc-publico' and public.mdc_is_admin());

-- ---------------------------------------------------------------------
-- Configurações novas
-- ---------------------------------------------------------------------
insert into public.mdc_settings (key, value, visibilidade) values
  ('vendas',          '{}'::jsonb, 'public'),
  ('termo',           '{}'::jsonb, 'public'),
  ('pagamento',       '{}'::jsonb, 'auth'),
  ('msgs_vencimento', '{}'::jsonb, 'admin')
on conflict (key) do nothing;
