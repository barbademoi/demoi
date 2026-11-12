-- =====================================================================
-- TAREFIX — 002 · RLS
-- Dono (Supabase Auth) só enxerga linhas da própria empresa.
-- Colaborador NÃO usa Supabase Auth: todo acesso dele passa por API routes
-- do Next, que validam token + sessão do PIN e usam a service role
-- (que ignora RLS) no servidor. Por isso não há policy para "anon".
-- =====================================================================

-- empresa do usuário logado (security definer para não recursar no RLS)
create or replace function public.minha_empresa()
returns uuid language sql stable security definer set search_path = public as $$
  select empresa_id from public.donos where id = auth.uid()
$$;

revoke all on function public.minha_empresa() from public;
grant execute on function public.minha_empresa() to authenticated;

alter table public.empresas        enable row level security;
alter table public.donos           enable row level security;
alter table public.funcoes         enable row level security;
alter table public.colaboradores   enable row level security;
alter table public.tarefas_modelo  enable row level security;
alter table public.tarefas_avulsas enable row level security;
alter table public.folgas          enable row level security;
alter table public.tarefas_dia     enable row level security;
alter table public.extras          enable row level security;
alter table public.bonus_config    enable row level security;
alter table public.avisos          enable row level security;
alter table public.meses_fechados  enable row level security;

-- empresas: lê e edita só a sua (criar/apagar empresa fica fora da V1)
create policy empresas_select on public.empresas for select to authenticated
  using (id = public.minha_empresa());
create policy empresas_update on public.empresas for update to authenticated
  using (id = public.minha_empresa()) with check (id = public.minha_empresa());

-- donos: vê os donos da própria empresa; edita só o próprio registro
create policy donos_select on public.donos for select to authenticated
  using (empresa_id = public.minha_empresa());
create policy donos_update on public.donos for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and empresa_id = public.minha_empresa());

-- Demais tabelas: CRUD completo dentro da própria empresa.
do $$
declare
  t text;
begin
  foreach t in array array[
    'funcoes', 'colaboradores', 'tarefas_modelo', 'tarefas_avulsas', 'folgas',
    'tarefas_dia', 'extras', 'bonus_config', 'avisos', 'meses_fechados'
  ] loop
    execute format(
      'create policy %1$s_dono on public.%1$s for all to authenticated
         using (empresa_id = public.minha_empresa())
         with check (empresa_id = public.minha_empresa())', t);
  end loop;
end $$;

-- Ninguém anônimo acessa nada direto.
revoke all on all tables in schema public from anon;
