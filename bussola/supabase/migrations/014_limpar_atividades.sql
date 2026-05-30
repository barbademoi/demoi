-- Bússola — AJUSTE H Parte 1: limpa registros de leitura/resposta
-- (zera "Atividade da Equipe").
--
-- Use APENAS pra limpar a sua própria empresa. Substitua o email abaixo.
-- O endpoint /api/admin/limpar-atividades faz a mesma coisa via UI
-- (acessível em Configurações).

update feedbacks
set lido_em = null,
    resposta_profissional = null,
    resposta_em = null
where estabelecimento_id in (
  select e.id
  from estabelecimentos e
  join auth.users u on u.id = e.dono_id
  where u.email = 'barbeariademoi@gmail.com'
);
