-- =====================================================================
-- TAREFIX — 002 · RLS
-- Dono (Supabase Auth) só enxerga linhas da própria empresa.
-- Colaborador NÃO usa Supabase Auth: todo acesso dele passa por API routes
-- do Next, que validam token + sessão do PIN e usam a service role
-- (que ignora RLS) no servidor. Por isso não há policy para "anon".
-- =====================================================================

-- empresa do usuário logado (security definer para não recursar no RLS)
create or replace function tarefix.minha_empresa()
returns uuid language sql stable security definer set search_path = tarefix as $$
  select empresa_id from tarefix.donos where id = auth.uid()
$$;

revoke all on function tarefix.minha_empresa() from public, anon;
grant execute on function tarefix.minha_empresa() to authenticated;

alter table tarefix.empresas        enable row level security;
alter table tarefix.donos           enable row level security;
alter table tarefix.funcoes         enable row level security;
alter table tarefix.colaboradores   enable row level security;
alter table tarefix.tarefas_modelo  enable row level security;
alter table tarefix.tarefas_avulsas enable row level security;
alter table tarefix.folgas          enable row level security;
alter table tarefix.tarefas_dia     enable row level security;
alter table tarefix.extras          enable row level security;
alter table tarefix.bonus_config    enable row level security;
alter table tarefix.avisos          enable row level security;
alter table tarefix.meses_fechados  enable row level security;

-- empresas: lê e edita só a sua (criar/apagar empresa fica fora da V1)
create policy empresas_select on tarefix.empresas for select to authenticated
  using (id = tarefix.minha_empresa());
create policy empresas_update on tarefix.empresas for update to authenticated
  using (id = tarefix.minha_empresa()) with check (id = tarefix.minha_empresa());

-- donos: vê os donos da própria empresa; edita só o próprio registro
create policy donos_select on tarefix.donos for select to authenticated
  using (empresa_id = tarefix.minha_empresa());
create policy donos_update on tarefix.donos for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and empresa_id = tarefix.minha_empresa());

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
      'create policy %1$s_dono on tarefix.%1$s for all to authenticated
         using (empresa_id = tarefix.minha_empresa())
         with check (empresa_id = tarefix.minha_empresa())', t);
  end loop;
end $$;

-- Permissões do schema (fora do public o Supabase não concede nada sozinho).
-- anon não recebe NADA: ninguém anônimo acessa o Tarefix direto.
grant select, insert, update, delete on all tables in schema tarefix to authenticated;
grant all on all tables in schema tarefix to service_role;
grant execute on all functions in schema tarefix to authenticated, service_role;
revoke all on all tables in schema tarefix from anon;
