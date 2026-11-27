-- =====================================================================
-- MDC — FASE 3 — Área do membro: encontros, Kit, missões, ranking
-- Rode depois do 002. Pode rodar de novo.
--
-- Regra dos cadeados (conferida AQUI, no banco, não só na tela):
--   conteúdo da semana N do nível L abre quando
--   semana do membro >= (L - 1) * 13 + N.
--   Ex.: nível 1 semana 5 abre na semana 5; nível 2 semana 1 abre na 14.
--   Da semana 14 em diante todo o nível 1 está aberto (14 > 13).
-- =====================================================================

-- Perfil do membro (para escolher as missões certas).
create or replace function public.mdc_member_perfil(p_uid uuid default auth.uid())
returns text language sql stable security definer set search_path = public as $$
  select coalesce(perfil, 'sozinho') from public.mdc_members
  where id = p_uid and (p_uid = auth.uid() or public.mdc_is_admin());
$$;
-- anon pode chamar (usado dentro das policies): para quem não está logado a resposta é sempre falso/vazio.
revoke all on function public.mdc_member_perfil(uuid) from public;
grant execute on function public.mdc_member_perfil(uuid) to anon, authenticated, service_role;

-- Pode ver o conteúdo da semana N do nível L?
create or replace function public.mdc_semana_liberada(p_nivel int, p_semana int)
returns boolean language sql stable security definer set search_path = public as $$
  select public.mdc_is_active_member()
     and coalesce(public.mdc_member_week(), 0) >= (p_nivel - 1) * 13 + p_semana;
$$;
-- anon pode chamar (usado dentro das policies): para quem não está logado a resposta é sempre falso/vazio.
revoke all on function public.mdc_semana_liberada(int, int) from public;
grant execute on function public.mdc_semana_liberada(int, int) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- Ciclo de 13 temas (semana do ciclo → tema e pilar)
-- ---------------------------------------------------------------------
create table if not exists public.mdc_ciclo (
  semana int primary key check (semana between 1 and 13),
  tema   text not null,
  pilar  text not null check (pilar in ('Dono', 'Ambiente e atendimento', 'Equipe', 'Números e retenção', 'Crescimento'))
);
alter table public.mdc_ciclo enable row level security;
drop policy if exists mdc_ciclo_select on public.mdc_ciclo;
create policy mdc_ciclo_select on public.mdc_ciclo for select using (public.mdc_is_active_member() or public.mdc_is_admin());
drop policy if exists mdc_ciclo_admin on public.mdc_ciclo;
create policy mdc_ciclo_admin on public.mdc_ciclo for all using (public.mdc_is_admin()) with check (public.mdc_is_admin());

insert into public.mdc_ciclo (semana, tema, pilar) values
  (1, 'Tema da semana 1', 'Dono'),
  (2, 'Tema da semana 2', 'Dono'),
  (3, 'Tema da semana 3', 'Ambiente e atendimento'),
  (4, 'Tema da semana 4', 'Ambiente e atendimento'),
  (5, 'Tema da semana 5', 'Ambiente e atendimento'),
  (6, 'Tema da semana 6', 'Equipe'),
  (7, 'Tema da semana 7', 'Equipe'),
  (8, 'Tema da semana 8', 'Equipe'),
  (9, 'Tema da semana 9', 'Números e retenção'),
  (10, 'Tema da semana 10', 'Números e retenção'),
  (11, 'Tema da semana 11', 'Números e retenção'),
  (12, 'Tema da semana 12', 'Crescimento'),
  (13, 'Tema da semana 13', 'Crescimento')
on conflict (semana) do nothing;

-- ---------------------------------------------------------------------
-- Encontros (resumo em PDF + gravação no YouTube não listado)
-- ---------------------------------------------------------------------
create table if not exists public.mdc_meetings (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  nivel       int not null default 1 check (nivel between 1 and 9),
  semana      int not null check (semana between 1 and 13),
  data        date not null,
  tema        text not null,
  pdf_path    text,
  youtube_url text,
  is_ultimo   boolean not null default false
);
create index if not exists mdc_meetings_semana_idx on public.mdc_meetings (nivel, semana, data desc);
-- Só um "último encontro" por vez.
create unique index if not exists mdc_meetings_um_ultimo on public.mdc_meetings (is_ultimo) where is_ultimo;

alter table public.mdc_meetings enable row level security;
drop policy if exists mdc_meetings_select on public.mdc_meetings;
create policy mdc_meetings_select on public.mdc_meetings for select using (
  public.mdc_is_admin()
  -- o resumo do último encontro é sempre liberado para todo membro ativo
  or (public.mdc_is_active_member() and is_ultimo)
  or public.mdc_semana_liberada(nivel, semana)
);
drop policy if exists mdc_meetings_admin on public.mdc_meetings;
create policy mdc_meetings_admin on public.mdc_meetings for all using (public.mdc_is_admin()) with check (public.mdc_is_admin());

-- ---------------------------------------------------------------------
-- Kit Demôi (PDFs ligados a uma semana)
-- ---------------------------------------------------------------------
create table if not exists public.mdc_kit_materials (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  nivel       int not null default 1 check (nivel between 1 and 9),
  semana      int not null check (semana between 1 and 13),
  titulo      text not null,
  descricao   text,
  file_path   text not null,
  ordem       int not null default 0
);
create index if not exists mdc_kit_semana_idx on public.mdc_kit_materials (nivel, semana, ordem);
alter table public.mdc_kit_materials enable row level security;
drop policy if exists mdc_kit_select on public.mdc_kit_materials;
create policy mdc_kit_select on public.mdc_kit_materials for select using (public.mdc_is_admin() or public.mdc_semana_liberada(nivel, semana));
drop policy if exists mdc_kit_admin on public.mdc_kit_materials;
create policy mdc_kit_admin on public.mdc_kit_materials for all using (public.mdc_is_admin()) with check (public.mdc_is_admin());

-- ---------------------------------------------------------------------
-- Modelos de missão
--   semana = semana DO MEMBRO (1, 2, ... 14+). Hábito diário é acumulativo:
--   o que entra na semana 3 continua na 4, 5, ...
-- ---------------------------------------------------------------------
create table if not exists public.mdc_mission_templates (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  perfil          text not null check (perfil in ('sozinho', 'equipe', 'ambos')),
  semana          int not null check (semana between 1 and 200),
  tipo            text not null check (tipo in ('habito_diario', 'missao_semana')),
  titulo          text not null,
  descricao       text,
  kit_material_id uuid references public.mdc_kit_materials (id) on delete set null,
  ordem           int not null default 0,
  ativo           boolean not null default true
);
create index if not exists mdc_mt_semana_idx on public.mdc_mission_templates (tipo, semana, perfil);
alter table public.mdc_mission_templates enable row level security;
drop policy if exists mdc_mt_select on public.mdc_mission_templates;
create policy mdc_mt_select on public.mdc_mission_templates for select using (
  public.mdc_is_admin()
  or (public.mdc_is_active_member() and ativo
      and semana <= coalesce(public.mdc_member_week(), 0)
      and perfil in (public.mdc_member_perfil(), 'ambos'))
);
drop policy if exists mdc_mt_admin on public.mdc_mission_templates;
create policy mdc_mt_admin on public.mdc_mission_templates for all using (public.mdc_is_admin()) with check (public.mdc_is_admin());

-- ---------------------------------------------------------------------
-- Registro das missões marcadas
--   hábito: 1 linha por dia (dia preenchido)
--   missão da semana: 1 linha por semana do membro (dia vazio)
-- ---------------------------------------------------------------------
create table if not exists public.mdc_mission_logs (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  member_id   uuid not null references public.mdc_members (id) on delete cascade,
  template_id uuid not null references public.mdc_mission_templates (id) on delete cascade,
  dia         date,
  semana      int not null,
  observacao  text check (observacao is null or char_length(observacao) <= 1000)
);
create unique index if not exists mdc_ml_habito_unq on public.mdc_mission_logs (member_id, template_id, dia) where dia is not null;
create unique index if not exists mdc_ml_missao_unq on public.mdc_mission_logs (member_id, template_id, semana) where dia is null;
create index if not exists mdc_ml_member_idx on public.mdc_mission_logs (member_id, dia);

alter table public.mdc_mission_logs enable row level security;
drop policy if exists mdc_ml_select on public.mdc_mission_logs;
create policy mdc_ml_select on public.mdc_mission_logs for select using (member_id = auth.uid() or public.mdc_is_admin());

-- Marca só o que está liberado pra ele, e só hoje/ontem (hábito) ou a semana atual (missão).
drop policy if exists mdc_ml_insert on public.mdc_mission_logs;
create policy mdc_ml_insert on public.mdc_mission_logs for insert to authenticated with check (
  member_id = auth.uid()
  and public.mdc_is_active_member()
  and exists (select 1 from public.mdc_mission_templates t where t.id = template_id)  -- passa pelo RLS dos modelos
  and (
    (dia is not null and dia between public.mdc_hoje() - 1 and public.mdc_hoje() and semana <= public.mdc_member_week())
    or (dia is null and semana = public.mdc_member_week())
  )
);
drop policy if exists mdc_ml_update on public.mdc_mission_logs;
create policy mdc_ml_update on public.mdc_mission_logs for update to authenticated
  using (member_id = auth.uid() and public.mdc_is_active_member())
  with check (member_id = auth.uid());
drop policy if exists mdc_ml_delete on public.mdc_mission_logs;
create policy mdc_ml_delete on public.mdc_mission_logs for delete to authenticated using (
  member_id = auth.uid() and public.mdc_is_active_member()
  and ((dia is not null and dia >= public.mdc_hoje() - 1) or (dia is null and semana = public.mdc_member_week()))
);
drop policy if exists mdc_ml_admin on public.mdc_mission_logs;
create policy mdc_ml_admin on public.mdc_mission_logs for all using (public.mdc_is_admin()) with check (public.mdc_is_admin());

-- Impede trocar template/dia/semana num update (só a observação muda).
create or replace function public.mdc_ml_trava_update() returns trigger language plpgsql as $$
begin
  if new.member_id <> old.member_id or new.template_id <> old.template_id
     or new.dia is distinct from old.dia or new.semana <> old.semana then
    raise exception 'Só a observação pode mudar';
  end if;
  return new;
end $$;
drop trigger if exists mdc_ml_trava on public.mdc_mission_logs;
create trigger mdc_ml_trava before update on public.mdc_mission_logs for each row execute function public.mdc_ml_trava_update();

-- ---------------------------------------------------------------------
-- Progresso: itens marcados ÷ itens previstos no período.
--   hábitos: cada dia do período (até hoje, desde o início do membro) conta
--            os hábitos liberados até a semana daquele dia;
--   missões: as missões das semanas que COMEÇAM dentro do período.
-- Função interna (sem checagem de quem chama): só o banco e a service role.
-- ---------------------------------------------------------------------
create or replace function public._mdc_progresso(p_member uuid, p_de date, p_ate date, p_missoes boolean)
returns table (previstos int, feitos int)
language sql stable security definer set search_path = public as $$
  with m as (
    select data_inicio, coalesce(perfil, 'sozinho') as perfil from public.mdc_members where id = p_member
  ),
  dias as (
    select d::date as dia, ((d::date - m.data_inicio) / 7) + 1 as semana
    from m, generate_series(greatest(p_de, m.data_inicio), p_ate, interval '1 day') d
    where m.data_inicio is not null
  ),
  hab as (
    select dias.dia, t.id as template_id
    from dias join public.mdc_mission_templates t
      on t.tipo = 'habito_diario' and t.ativo and t.semana <= dias.semana
     and t.perfil in ((select perfil from m), 'ambos')
  ),
  sem as (
    select distinct dias.semana from dias, m
    where p_missoes and m.data_inicio + (dias.semana - 1) * 7 >= p_de
  ),
  mis as (
    select sem.semana, t.id as template_id
    from sem join public.mdc_mission_templates t
      on t.tipo = 'missao_semana' and t.ativo and t.semana = sem.semana
     and t.perfil in ((select perfil from m), 'ambos')
  )
  select
    ((select count(*) from hab) + (select count(*) from mis))::int,
    ((select count(*) from hab h join public.mdc_mission_logs l
        on l.member_id = p_member and l.template_id = h.template_id and l.dia = h.dia)
     + (select count(*) from mis x join public.mdc_mission_logs l
        on l.member_id = p_member and l.template_id = x.template_id and l.dia is null and l.semana = x.semana))::int;
$$;
revoke all on function public._mdc_progresso(uuid, date, date, boolean) from public, anon, authenticated;
grant execute on function public._mdc_progresso(uuid, date, date, boolean) to service_role;

create or replace function public.mdc_pct(p int, f int) returns int language sql immutable as $$
  select case when coalesce(p, 0) = 0 then 0 else least(100, round(f * 100.0 / p))::int end
$$;

-- % de hoje, da semana e do mês do PRÓPRIO membro.
create or replace function public.mdc_meu_progresso()
returns table (hoje int, semana int, mes int, hoje_prev int, hoje_feitos int)
language plpgsql stable security definer set search_path = public as $$
declare
  v_ini date; v_hoje date := public.mdc_hoje(); v_sem int; v_ini_sem date;
  a record; b record; c record;
begin
  select data_inicio into v_ini from public.mdc_members where id = auth.uid();
  if v_ini is null or not public.mdc_is_active_member() then return; end if;
  v_sem := ((v_hoje - v_ini) / 7) + 1;
  v_ini_sem := v_ini + (v_sem - 1) * 7;
  select * into a from public._mdc_progresso(auth.uid(), v_hoje, v_hoje, false);
  select * into b from public._mdc_progresso(auth.uid(), v_ini_sem, v_hoje, true);
  select * into c from public._mdc_progresso(auth.uid(), date_trunc('month', v_hoje)::date, v_hoje, true);
  return query select public.mdc_pct(a.previstos, a.feitos), public.mdc_pct(b.previstos, b.feitos),
                      public.mdc_pct(c.previstos, c.feitos), a.previstos, a.feitos;
end $$;
revoke all on function public.mdc_meu_progresso() from public, anon;
grant execute on function public.mdc_meu_progresso() to authenticated;

-- % do mês de todos os membros ativos (painel do admin, via service role).
create or replace function public.mdc_progresso_mes_todos()
returns table (member_id uuid, percentual int)
language sql stable security definer set search_path = public as $$
  select m.id, public.mdc_pct(p.previstos, p.feitos)
  from public.mdc_members m
  cross join lateral public._mdc_progresso(m.id, date_trunc('month', public.mdc_hoje())::date, public.mdc_hoje(), true) p
  where m.status = 'ativo' and m.vencimento >= public.mdc_hoje() and m.data_inicio <= public.mdc_hoje();
$$;
revoke all on function public.mdc_progresso_mes_todos() from public, anon, authenticated;
grant execute on function public.mdc_progresso_mes_todos() to service_role;

-- Ranking: só primeiro nome, cidade e %. Nunca dado financeiro.
create or replace function public.mdc_ranking_mes()
returns table (posicao int, primeiro_nome text, cidade text, uf text, percentual int, sou_eu boolean)
language sql stable security definer set search_path = public as $$
  select (rank() over (order by public.mdc_pct(p.previstos, p.feitos) desc))::int,
         split_part(trim(m.nome), ' ', 1),
         m.cidade, m.uf,
         public.mdc_pct(p.previstos, p.feitos),
         m.id = auth.uid()
  from public.mdc_members m
  cross join lateral public._mdc_progresso(m.id, date_trunc('month', public.mdc_hoje())::date, public.mdc_hoje(), true) p
  where (public.mdc_is_active_member() or public.mdc_is_admin())
    and m.status = 'ativo' and m.vencimento >= public.mdc_hoje() and m.data_inicio <= public.mdc_hoje()
  order by 5 desc, 2;
$$;
revoke all on function public.mdc_ranking_mes() from public, anon;
grant execute on function public.mdc_ranking_mes() to authenticated;

create or replace view public.mdc_ranking_mensal as select * from public.mdc_ranking_mes();
revoke all on public.mdc_ranking_mensal from anon;
grant select on public.mdc_ranking_mensal to authenticated;

-- ---------------------------------------------------------------------
-- Configurações: libera as de visibilidade 'member' para membro ativo.
-- ---------------------------------------------------------------------
drop policy if exists mdc_settings_select on public.mdc_settings;
create policy mdc_settings_select on public.mdc_settings for select using (
  visibilidade = 'public'
  or (visibilidade = 'auth' and auth.uid() is not null)
  or (visibilidade = 'member' and public.mdc_is_active_member())
  or public.mdc_is_admin()
);

insert into public.mdc_settings (key, value, visibilidade) values
  ('links_membros', '{}'::jsonb, 'member')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- Storage: "conteudo" PRIVADO (resumos em PDF e Kit Demôi).
-- Só o admin sobe. Membro recebe link assinado gerado no servidor, e só
-- depois que o RLS acima confirmou que a semana está liberada.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mdc-conteudo', 'mdc-conteudo', false, 52428800, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = false;

drop policy if exists mdc_conteudo_admin on storage.objects;
create policy mdc_conteudo_admin on storage.objects for all to authenticated
  using (bucket_id = 'mdc-conteudo' and public.mdc_is_admin())
  with check (bucket_id = 'mdc-conteudo' and public.mdc_is_admin());
