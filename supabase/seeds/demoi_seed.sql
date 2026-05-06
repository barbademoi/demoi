-- Seed: Demôi Barbearia — dados de exemplo
-- Execute APÓS criar um usuário pelo Supabase Auth e pegar o UUID

-- 1. Crie o usuário dono pelo painel Supabase Auth
--    e substitua 'UUID-DO-DONO' pelo id gerado

do $$
declare
  v_barbearia_id uuid := uuid_generate_v4();
  v_meta_id      uuid := uuid_generate_v4();
  -- Barbeiros
  id_ze      uuid := uuid_generate_v4();
  id_rael    uuid := uuid_generate_v4();
  id_ryan    uuid := uuid_generate_v4();
  id_caique  uuid := uuid_generate_v4();
  id_davi    uuid := uuid_generate_v4();
  id_gustavo uuid := uuid_generate_v4();
  id_rangel  uuid := uuid_generate_v4();
begin

  -- Barbearia
  insert into barbearias (id, nome, cor_principal)
  values (v_barbearia_id, 'Demôi Barbearia', '#2563EB');

  -- Barbeiros com link_codigo único
  insert into barbeiros (id, barbearia_id, nome, link_codigo) values
    (id_ze,      v_barbearia_id, 'Zé',      'demoi-ze'),
    (id_rael,    v_barbearia_id, 'Rael',    'demoi-rael'),
    (id_ryan,    v_barbearia_id, 'Ryan',    'demoi-ryan'),
    (id_caique,  v_barbearia_id, 'Caíque',  'demoi-caique'),
    (id_davi,    v_barbearia_id, 'Davi',    'demoi-davi'),
    (id_gustavo, v_barbearia_id, 'Gustavo', 'demoi-gustavo'),
    (id_rangel,  v_barbearia_id, 'Rangel',  'demoi-rangel');

  -- Meta coletiva — Maio 2025
  insert into metas (id, barbearia_id, mes, ano, meta_coletiva, premio_coletivo)
  values (v_meta_id, v_barbearia_id, 5, 2025, 60000.00, 'Noite de rodízio de pizza');

  -- Metas individuais
  insert into metas_individuais
    (meta_id, barbeiro_id, bronze_comm, prata_comm, ouro_comm)
  values
    (v_meta_id, id_ze,      5350.00, 5450.00, 5600.00),
    (v_meta_id, id_rael,    5350.00, 5450.00, 5600.00),
    (v_meta_id, id_ryan,    4400.00, 4450.00, 4600.00),
    (v_meta_id, id_caique,  4200.00, 4200.00, 4400.00),
    (v_meta_id, id_davi,    4100.00, 4250.00, 4400.00),
    (v_meta_id, id_gustavo, 3400.00, 3500.00, 3800.00),
    (v_meta_id, id_rangel,   800.00, 1000.00, 1200.00);

end $$;
