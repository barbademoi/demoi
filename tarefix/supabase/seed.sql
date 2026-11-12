-- =====================================================================
-- TAREFIX — Seed inicial: 1 empresa + o dono.
--
-- ANTES de rodar:
--   1. Supabase → Authentication → Users → "Add user" → "Create new user"
--      com seu e-mail e senha (marque "Auto Confirm User").
--   2. Troque os 2 valores abaixo (e-mail e seu nome) e rode no SQL Editor.
-- Pode rodar de novo sem duplicar.
-- =====================================================================

do $$
declare
  v_email   text := 'SEU_EMAIL_AQUI@exemplo.com';  -- <<< troque
  v_nome    text := 'Seu Nome';                    -- <<< troque
  v_empresa text := 'Demôi';
  v_user    uuid;
  v_emp     uuid;
begin
  select id into v_user from auth.users where lower(email) = lower(v_email);
  if v_user is null then
    raise exception 'Usuário % não existe em auth.users. Crie em Authentication → Users primeiro.', v_email;
  end if;

  select empresa_id into v_emp from public.donos where id = v_user;

  if v_emp is null then
    insert into public.empresas (nome) values (v_empresa) returning id into v_emp;
    insert into public.donos (id, empresa_id, nome, email) values (v_user, v_emp, v_nome, v_email);
  end if;

  insert into public.bonus_config (empresa_id, ativo, mostrar_para_colaborador, niveis)
  values (v_emp, false, true, '[{"percentual": 90, "premio": "R$ 50"}, {"percentual": 100, "premio": "R$ 100"}]')
  on conflict (empresa_id) do nothing;

  raise notice 'Pronto. empresa_id = %', v_emp;
end $$;
