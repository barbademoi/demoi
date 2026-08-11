-- 051_popup_brindoleta.sql
-- POPUP DE OFERTA DA BRINDOLETA — estado por usuário + mídia da demonstração.
--
-- O popup vende a Brindoleta pra quem ainda não tem (principalmente os
-- vitalícios). Quem já tem — por licença avulsa ou por assinatura ativa — nunca
-- vê: quem decide isso é `brindoleta_liberada()` (migration 049), a mesma
-- função que libera o módulo. Uma segunda régua aqui poderia discordar dela e
-- oferecer a alguém algo que a pessoa já pagou.
--
-- POR QUE NO BANCO E NÃO NO NAVEGADOR: o combinado é "fechou, não volta por 7
-- dias". Em localStorage isso vira "não volta por 7 dias NESTE navegador" — o
-- dono abre no celular e leva o popup na cara de novo, no mesmo dia. Só o banco
-- respeita a promessa em qualquer aparelho.
--
-- Idempotente.

-- ── 1. Estado por usuário ─────────────────────────────────────────────────
create table if not exists public.brindoleta_popup_estado (
  usuario_id      uuid primary key references auth.users(id) on delete cascade,
  -- Fechou no X: só reaparece a partir daqui.
  adiado_ate      timestamptz,
  -- Clicou em "não tenho interesse": para de aparecer de vez.
  sem_interesse   boolean not null default false,
  ultima_exibicao timestamptz,
  vezes           integer not null default 0,
  atualizado_em   timestamptz not null default now()
);

comment on table public.brindoleta_popup_estado is
  'Quando o popup da Brindoleta pode voltar a aparecer, por usuário. Fica no '
  'banco (e não no navegador) pra promessa de "7 dias" valer em qualquer aparelho.';
comment on column public.brindoleta_popup_estado.sem_interesse is
  'true quando a pessoa disse que não quer. Respeitar isso é o que separa '
  'oferta de insistência.';

-- ── 2. Mídia da demonstração ──────────────────────────────────────────────
-- Linha única. O GIF/vídeo é trocado pelo admin sem deploy; enquanto estiver
-- vazio, o popup mostra um placeholder e continua funcionando.
create table if not exists public.brindoleta_popup_config (
  id            boolean primary key default true check (id),
  midia_url     text,
  midia_tipo    text check (midia_tipo is null or midia_tipo in ('gif', 'video')),
  atualizado_em timestamptz not null default now()
);

insert into public.brindoleta_popup_config (id) values (true) on conflict (id) do nothing;

-- ── 3. RLS ────────────────────────────────────────────────────────────────
alter table public.brindoleta_popup_estado enable row level security;
alter table public.brindoleta_popup_config enable row level security;

-- Cada um só enxerga e escreve o PRÓPRIO estado. Sem isso, um dono poderia
-- silenciar o popup de outro — ou ler o que outro respondeu à oferta.
drop policy if exists "popup_estado_proprio" on public.brindoleta_popup_estado;
create policy "popup_estado_proprio" on public.brindoleta_popup_estado
  for select to authenticated
  using (usuario_id = auth.uid());

drop policy if exists "popup_estado_grava" on public.brindoleta_popup_estado;
create policy "popup_estado_grava" on public.brindoleta_popup_estado
  for insert to authenticated
  with check (usuario_id = auth.uid());

drop policy if exists "popup_estado_atualiza" on public.brindoleta_popup_estado;
create policy "popup_estado_atualiza" on public.brindoleta_popup_estado
  for update to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

-- A mídia é a mesma pra todo mundo: qualquer logado lê, só o service_role
-- (painel admin) escreve.
drop policy if exists "popup_config_leitura" on public.brindoleta_popup_config;
create policy "popup_config_leitura" on public.brindoleta_popup_config
  for select to authenticated
  using (true);

-- ── 4. Deve aparecer? ─────────────────────────────────────────────────────
-- Uma função só responde, e é a mesma usada pela tela e por qualquer conferência
-- futura. `security definer` porque precisa enxergar a barbearia do usuário e a
-- licença dela sem depender do RLS de cada tabela.
create or replace function public.brindoleta_popup_deve_aparecer()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    -- 1) Quem já tem a Brindoleta nunca vê. Mesma régua que libera o módulo.
    not coalesce(
      (select public.brindoleta_liberada(u.barbearia_id)
         from public.usuarios u where u.id = auth.uid()),
      true  -- sem usuário/barbearia identificável: não oferece nada.
    )
    -- 2) Não disse que não quer, e o adiamento já venceu.
    and not exists (
      select 1
      from public.brindoleta_popup_estado e
      where e.usuario_id = auth.uid()
        and (
          e.sem_interesse
          or (e.adiado_ate is not null and e.adiado_ate > now())
        )
    );
$$;

grant execute on function public.brindoleta_popup_deve_aparecer() to authenticated;

comment on function public.brindoleta_popup_deve_aparecer() is
  'true quando o popup da Brindoleta pode aparecer pro usuário logado: ele não '
  'tem o módulo, não recusou e não está no intervalo de adiamento.';

-- ── 5. Conferência ────────────────────────────────────────────────────────
do $$
begin
  -- Estado de um usuário não pode ser legível por outro: é o que impede
  -- silenciar (ou bisbilhotar) a oferta alheia.
  if exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'brindoleta_popup_estado'
       and coalesce(qual, with_check) not like '%auth.uid()%'
  ) then
    raise exception 'Policy de brindoleta_popup_estado sem amarrar a auth.uid().';
  end if;

  raise notice 'OK: popup da Brindoleta com estado por usuário e RLS por dono.';
end $$;
