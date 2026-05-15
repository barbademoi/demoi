-- Documenta a coluna senha_temporaria (criada diretamente no DB anteriormente)
alter table usuarios add column if not exists senha_temporaria boolean default false;

-- Coluna que controla se o usuário já definiu sua própria senha via /boas-vindas
alter table usuarios add column if not exists senha_definida boolean default false;

-- ID de transação Hotmart — usado para validar o link de /boas-vindas
alter table usuarios add column if not exists hotmart_transaction text;

-- Usuários existentes já têm conta configurada
update usuarios set senha_definida = true where senha_definida = false;
