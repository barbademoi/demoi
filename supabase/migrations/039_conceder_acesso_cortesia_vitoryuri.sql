-- 039_conceder_acesso_cortesia_vitoryuri.sql
-- Concede ACESSO DE CORTESIA VITALÍCIA a vitoryuri2020@hotmail.com.
--
-- O usuário JÁ foi criado no Supabase Auth (email_confirm=true), mas ainda não
-- tinha a linha em `usuarios` nem uma barbearia — sem isso o app não deixa
-- logar/usar. Esta migration cria o vínculo que falta e marca como cortesia.
--
-- Depende da 038 (colunas tipo_acesso/origem em usuarios). NÃO vincula Hotmart.
-- Escopo 100% nesse e-mail. Idempotente: rodar de novo não duplica nada.

do $$
declare
  v_email        text := 'vitoryuri2020@hotmail.com';
  v_user_id      uuid;
  v_barbearia_id uuid;
begin
  -- 1) Acha o usuário no Auth (tem que existir — criado à mão no painel).
  select id into v_user_id from auth.users where lower(email) = lower(v_email);
  if v_user_id is null then
    raise exception 'Auth user % não existe. Crie em Authentication → Add user (Auto Confirm) antes de rodar.', v_email;
  end if;

  -- 2) Já tem conta ligada? Então só (re)marca a cortesia — não cria de novo.
  if exists (select 1 from public.usuarios where id = v_user_id) then
    update public.usuarios
      set tipo_acesso = 'vitalicio', origem = 'cortesia'
      where id = v_user_id;
    raise notice 'Conta já existia — marcada como cortesia vitalícia.';
    return;
  end if;

  -- 3) Cria a barbearia (entra no fluxo de primeiro acesso/onboarding).
  insert into public.barbearias (nome, onboarding_completo)
    values ('Barbearia (cortesia)', false)
    returning id into v_barbearia_id;

  -- 4) Cria a linha em usuarios ligando Auth ↔ barbearia, marcada como cortesia.
  --    senha_definida=true + senha_temporaria=false → loga direto com a senha
  --    definida no Auth, sem reset obrigatório. Sem Hotmart.
  insert into public.usuarios
    (id, barbearia_id, email, senha_definida, senha_temporaria, tipo_acesso, origem)
    values
    (v_user_id, v_barbearia_id, v_email, true, false, 'vitalicio', 'cortesia');

  raise notice 'Acesso de cortesia vitalícia concedido a %.', v_email;
end $$;
