-- Bússola — PROMPT I: Tutoriais
-- Não destrutivo. 3 tabelas + RLS + seed com 20 tutoriais e ~80 passos.
-- Tutoriais são globais (todas as empresas leem a mesma base).
-- Progresso (tutoriais_lidos) é por empresa.

-- ============================================================
-- 1) Tabelas
-- ============================================================

create table if not exists tutoriais (
  id uuid primary key default gen_random_uuid(),
  categoria text not null check (categoria in (
    'primeiros_passos',
    'reuniao',
    'feedback',
    'cliente',
    'configuracoes'
  )),
  titulo text not null,
  descricao_curta text,
  ordem integer not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_tutoriais_categoria on tutoriais(categoria, ordem);

create table if not exists tutorial_passos (
  id uuid primary key default gen_random_uuid(),
  tutorial_id uuid not null references tutoriais(id) on delete cascade,
  numero integer not null,
  titulo text,
  conteudo text not null,
  dica text,
  created_at timestamptz not null default now(),
  unique(tutorial_id, numero)
);

create table if not exists tutoriais_lidos (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  tutorial_id uuid not null references tutoriais(id) on delete cascade,
  lido_em timestamptz not null default now(),
  unique(estabelecimento_id, tutorial_id)
);
create index if not exists idx_tutoriais_lidos_estab on tutoriais_lidos(estabelecimento_id);

-- ============================================================
-- 2) RLS
-- ============================================================

alter table tutoriais enable row level security;
drop policy if exists "todos podem ler tutoriais ativos" on tutoriais;
create policy "todos podem ler tutoriais ativos"
  on tutoriais for select
  using (ativo = true);

alter table tutorial_passos enable row level security;
drop policy if exists "todos podem ler passos de tutoriais ativos" on tutorial_passos;
create policy "todos podem ler passos de tutoriais ativos"
  on tutorial_passos for select
  using (tutorial_id in (select id from tutoriais where ativo = true));

alter table tutoriais_lidos enable row level security;
drop policy if exists "empresa ve seu progresso" on tutoriais_lidos;
create policy "empresa ve seu progresso"
  on tutoriais_lidos for all
  using (estabelecimento_id in (select id from estabelecimentos where dono_id = auth.uid()))
  with check (estabelecimento_id in (select id from estabelecimentos where dono_id = auth.uid()));

-- ============================================================
-- 3) Seed — 20 tutoriais
-- ============================================================

-- Helper: limpa qualquer seed anterior para refazer (idempotente)
delete from tutorial_passos where tutorial_id in (
  select id from tutoriais where titulo in (
    'Como cadastrar sua equipe',
    'Como registrar sua primeira observação',
    'Como compartilhar o link com seu colaborador',
    'Entendendo a Home da Bússola',
    'Como preparar a reunião',
    'Como conduzir os 6 momentos',
    'Como definir metas que funcionam',
    'Como revisar metas da semana anterior',
    'Como dar um elogio que funciona',
    'Como apontar algo a melhorar sem ferir',
    'Como usar as dicas da IA no Modo Reunião',
    'Quando falar em particular x na reunião',
    'Como ativar a coleta de feedback',
    'Como cadastrar brindes',
    'Como compartilhar feedback com a equipe',
    'Como transformar feedback em melhoria real',
    'Como adicionar a logo da empresa',
    'Como ajustar dia e hora da reunião',
    'Como personalizar categorias de observação',
    'Como gerenciar colaboradores'
  )
);

-- Tutoriais (com WITH ... INSERT pra pegar ids)
with novos(categoria, titulo, descricao_curta, ordem) as (values
  -- PRIMEIROS PASSOS
  ('primeiros_passos', 'Como cadastrar sua equipe', 'Antes de qualquer observação, cadastre cada colaborador.', 10),
  ('primeiros_passos', 'Como registrar sua primeira observação', 'O hábito que sustenta toda a reunião semanal.', 20),
  ('primeiros_passos', 'Como compartilhar o link com seu colaborador', 'Cada pessoa tem um link próprio para acompanhar suas anotações.', 30),
  ('primeiros_passos', 'Entendendo a Home da Bússola', 'O que cada bloco da tela inicial mostra e por quê.', 40),
  -- REUNIAO
  ('reuniao', 'Como preparar a reunião', 'A preparação rápida que organiza o que será dito.', 10),
  ('reuniao', 'Como conduzir os 6 momentos', 'A estrutura que dá ritmo e clareza à reunião.', 20),
  ('reuniao', 'Como definir metas que funcionam', 'Metas pequenas e verificáveis que sustentam a evolução.', 30),
  ('reuniao', 'Como revisar metas da semana anterior', 'Fechar o ciclo antes de abrir o próximo.', 40),
  -- FEEDBACK
  ('feedback', 'Como dar um elogio que funciona', 'O reconhecimento que estimula o repeat.', 10),
  ('feedback', 'Como apontar algo a melhorar sem ferir', 'A correção firme que preserva a confiança.', 20),
  ('feedback', 'Como usar as dicas da IA no Modo Reunião', 'A IA como copiloto, não como dona da conversa.', 30),
  ('feedback', 'Quando falar em particular x na reunião', 'O critério prático para escolher o canal certo.', 40),
  -- CLIENTE
  ('cliente', 'Como ativar a coleta de feedback', 'Um link público para clientes finais avaliarem a empresa.', 10),
  ('cliente', 'Como cadastrar brindes', 'Sorteio de mimos como incentivo à devolutiva.', 20),
  ('cliente', 'Como compartilhar feedback com a equipe', 'Levar a voz do cliente para o colaborador certo.', 30),
  ('cliente', 'Como transformar feedback em melhoria real', 'Do dado solto ao ajuste concreto na operação.', 40),
  -- CONFIGURACOES
  ('configuracoes', 'Como adicionar a logo da empresa', 'Identidade visual presente em todas as telas.', 10),
  ('configuracoes', 'Como ajustar dia e hora da reunião', 'Frequência que se encaixa na rotina real.', 20),
  ('configuracoes', 'Como personalizar categorias de observação', 'Etiquetas que organizam o histórico do colaborador.', 30),
  ('configuracoes', 'Como gerenciar colaboradores', 'Adicionar, desligar e reativar sem perder histórico.', 40)
)
insert into tutoriais (categoria, titulo, descricao_curta, ordem)
select n.categoria, n.titulo, n.descricao_curta, n.ordem
from novos n
where not exists (
  select 1 from tutoriais t where t.titulo = n.titulo
);

-- ============================================================
-- 4) Passos — agrupados por tutorial
-- ============================================================

-- Helper macro: insere passos pegando id por título
-- (PostgreSQL não tem macros; usamos CTE por bloco)

-- 4.1) Como cadastrar sua equipe
insert into tutorial_passos (tutorial_id, numero, titulo, conteudo, dica)
select t.id, p.numero, p.titulo, p.conteudo, p.dica
from tutoriais t,
(values
  (1, 'Abra a área de colaboradores', 'No menu lateral, vá até Colaboradores. É ali que vivem os perfis de cada pessoa da sua equipe. Cada colaborador tem nome, foto opcional e um link público próprio que ele usará pra acompanhar suas anotações.', null),
  (2, 'Cadastre uma pessoa por vez', 'Abra o formulário de novo colaborador e preencha pelo menos o nome. Foto e telefone são opcionais; podem ser adicionados depois. O cadastro cria automaticamente o link público dessa pessoa.', 'Escreva o nome como você normalmente chama a pessoa no dia a dia.'),
  (3, 'Repita pra cada membro da equipe', 'Não precisa cadastrar todo mundo de uma vez. Comece pelos que você convive diariamente. Os demais entram conforme você for tendo observações pra fazer sobre eles.', null),
  (4, 'Confira a lista', 'Volte pra Colaboradores e veja todos os cadastrados. A partir daqui, qualquer observação que você registrar pode ser vinculada a um deles.', 'Se cadastrou errado, você pode editar ou desligar o colaborador a qualquer momento sem perder o histórico.')
) as p(numero, titulo, conteudo, dica)
where t.titulo = 'Como cadastrar sua equipe';

-- 4.2) Como registrar sua primeira observação
insert into tutorial_passos (tutorial_id, numero, titulo, conteudo, dica)
select t.id, p.numero, p.titulo, p.conteudo, p.dica
from tutoriais t,
(values
  (1, 'Abra o registro de observação', 'No menu, vá em Registrar observação. É o atalho central da Bússola: o lugar pra capturar qualquer coisa que valha levantar com alguém da equipe, no momento em que acontece.', null),
  (2, 'Escolha quem (ou se é da equipe inteira)', 'Selecione um colaborador específico, ou marque como observação coletiva quando o assunto é do grupo. Observações individuais aparecem no link daquela pessoa; coletivas ficam pra ser tratadas na reunião.', null),
  (3, 'Escreva o que aconteceu, simples', 'Descreva o fato em poucas linhas, do jeito que você contaria pra um colega. Sem rótulos, sem julgamentos prontos. A IA depois classifica o momento certo da reunião pra abordar.', 'Registre o que viu, não o que concluiu. Em vez de "Foi displicente", escreva "Esqueceu de devolver duas ligações ontem".'),
  (4, 'Adicione uma categoria, se quiser', 'Categoria é opcional, mas ajuda a organizar o histórico. Use as padrão ou personalize em Configurações conforme o vocabulário da sua operação.', null),
  (5, 'Salve e siga', 'A observação fica armazenada e aparece automaticamente no histórico do colaborador e no preparo da próxima reunião. Você não precisa fazer mais nada agora.', 'Registre observações ao longo da semana, em pequenos blocos. É melhor do que tentar lembrar tudo na véspera da reunião.')
) as p(numero, titulo, conteudo, dica)
where t.titulo = 'Como registrar sua primeira observação';

-- 4.3) Como compartilhar o link com seu colaborador
insert into tutorial_passos (tutorial_id, numero, titulo, conteudo, dica)
select t.id, p.numero, p.titulo, p.conteudo, p.dica
from tutoriais t,
(values
  (1, 'Entenda o que é o link', 'Cada colaborador cadastrado ganha uma página pública e privada, acessível só por um endereço único. Ele entra ali sem login, sem senha, e vê todas as suas anotações sobre ele.', null),
  (2, 'Encontre o link da pessoa', 'Abra o perfil do colaborador na lista de Colaboradores. O link está visível no topo, pronto pra copiar.', null),
  (3, 'Envie por onde for natural', 'Mande por WhatsApp, e-mail ou qualquer canal que vocês já usem. Não tem app pra instalar, mas a pessoa pode salvar o link como atalho no celular pra abrir como se fosse um aplicativo.', 'Explique brevemente o que ele vai ver no primeiro envio. Algo como "esse é o seu espaço de anotações nossas, dá uma olhada quando puder".'),
  (4, 'Combine como a pessoa vai usar', 'Sugira que ele abra o link uma vez por semana, no mesmo dia. Quando ele marca uma anotação como vista, isso vira sinal de que ele leu e está acompanhando.', null)
) as p(numero, titulo, conteudo, dica)
where t.titulo = 'Como compartilhar o link com seu colaborador';

-- 4.4) Entendendo a Home da Bússola
insert into tutorial_passos (tutorial_id, numero, titulo, conteudo, dica)
select t.id, p.numero, p.titulo, p.conteudo, p.dica
from tutoriais t,
(values
  (1, 'Visão geral em três blocos', 'A Home reúne três tipos de informação: as observações recentes registradas por você, a atividade da equipe (quem visualizou ou respondeu o quê) e atalhos rápidos pras ações mais frequentes.', null),
  (2, 'Observações recentes', 'A lista mostra as últimas anotações que você fez, com nome do colaborador e trecho do texto. Clique em qualquer uma pra abrir o histórico completo daquela pessoa.', null),
  (3, 'Atividade da equipe', 'Esse bloco mostra quando cada colaborador visualizou suas observações ou respondeu algo. É como você sabe que sua mensagem chegou.', 'Sinal verde de visualizado não substitui conversa. Use como confirmação de leitura, não de entendimento.'),
  (4, 'Atalhos rápidos', 'Sempre acessíveis no topo: registrar nova observação, preparar a próxima reunião e ver feedback de clientes. São os botões pra começar qualquer rotina sem clicar muito.', null)
) as p(numero, titulo, conteudo, dica)
where t.titulo = 'Entendendo a Home da Bússola';

-- 4.5) Como preparar a reunião
insert into tutorial_passos (tutorial_id, numero, titulo, conteudo, dica)
select t.id, p.numero, p.titulo, p.conteudo, p.dica
from tutoriais t,
(values
  (1, 'Abra a tela de preparar', 'No menu, vá em Preparar Reunião. A Bússola junta tudo que você registrou desde a última reunião e organiza por colaborador e por momento.', null),
  (2, 'Revise as observações', 'A tela mostra cada anotação agrupada por pessoa. Você pode editar o texto, mudar a categoria ou descartar antes que entre na reunião.', 'Se uma observação ficou velha demais ou já foi resolvida no dia, descarte. Reunião não é arquivo morto.'),
  (3, 'Confira a sugestão da IA', 'A IA já distribuiu cada observação no momento mais natural da reunião. Confira e ajuste se quiser; você tem a palavra final.', null),
  (4, 'Inicie quando estiver pronto', 'Quando a lista parecer fiel ao que você quer abordar, é só iniciar o Modo Reunião. Ele te conduz pelos 6 momentos um a um, sem você precisar lembrar de tudo.', 'Reservar 5 minutos pra esse preparo antes da reunião evita 20 minutos de improviso depois.')
) as p(numero, titulo, conteudo, dica)
where t.titulo = 'Como preparar a reunião';

-- 4.6) Como conduzir os 6 momentos
insert into tutorial_passos (tutorial_id, numero, titulo, conteudo, dica)
select t.id, p.numero, p.titulo, p.conteudo, p.dica
from tutoriais t,
(values
  (1, 'Por que 6 momentos', 'A reunião é dividida em Abertura, Revisão, Reconhecimento, Equipe, Ajustes e Encerramento. Essa ordem foi pensada pra começar leve, valorizar o que foi feito antes de corrigir, e fechar com clareza do que vem.', null),
  (2, 'Abertura', 'Aquece o ambiente. Cumprimente, comente algo do dia, deixe a equipe respirar. Não é hora de assuntos pesados.', null),
  (3, 'Revisão', 'Olhe as metas e compromissos definidos na reunião anterior. O que foi cumprido? O que ficou pelo caminho? Sem cobrança bruta — entendimento.', 'Se uma meta da semana passada não fechou, pergunte antes de afirmar. Quase sempre há contexto que vale ouvir.'),
  (4, 'Reconhecimento', 'É o momento dos elogios concretos: o que cada um fez bem na semana. Seja específico, evite genérico tipo "tá indo bem". Bom: "atendeu a fila do sábado sem deixar ninguém esperando mais de 10 minutos".', null),
  (5, 'Equipe', 'Assuntos coletivos: combinados, ajustes de processo, avisos do negócio. É o espaço onde o grupo pensa junto, não você falando sozinho.', null),
  (6, 'Ajustes', 'A correção do que não foi bem. Aborde cada caso com calma, dirigindo-se à pessoa específica quando o tema é individual. O Modo Reunião te orienta a separar coletivo de individual.', 'Use a regra elogie em público, corrija em particular. Ajuste individual delicado merece conversa só de duas portas.'),
  (7, 'Encerramento', 'Resume o que foi combinado, alinha as metas da semana que entra, fecha. Termina a reunião com cada pessoa sabendo exatamente o próximo passo dela.', null)
) as p(numero, titulo, conteudo, dica)
where t.titulo = 'Como conduzir os 6 momentos';

-- 4.7) Como definir metas que funcionam
insert into tutorial_passos (tutorial_id, numero, titulo, conteudo, dica)
select t.id, p.numero, p.titulo, p.conteudo, p.dica
from tutoriais t,
(values
  (1, 'Meta semanal, não anual', 'A Bússola trabalha com metas de curto prazo: o que pode ser visto, medido e cobrado na reunião da semana que vem. Metas grandes demais viram névoa.', null),
  (2, 'Concreta e verificável', 'Uma boa meta responde sim ou não. "Melhorar atendimento" não responde. "Atender até 5 minutos depois da chegada do cliente" responde.', 'Se você não sabe como confirmaria se a meta foi cumprida, ela ainda está vaga demais.'),
  (3, 'Combinada, não imposta', 'Defina a meta junto com o colaborador no Encerramento da reunião. Quando a pessoa participa de definir, ela compra a entrega. Imposta, vira tarefa de cumprir só pra constar.', null),
  (4, 'Uma ou duas por pessoa', 'Mais que isso dilui o foco. Escolha o ponto mais importante da semana. Outras coisas podem virar observação solta, não meta.', null),
  (5, 'Registre durante a reunião', 'O Modo Reunião tem campo pra anotar a meta combinada com cada pessoa. Esse registro reaparece na Revisão da próxima reunião automaticamente.', 'Releia a meta em voz alta no final pra confirmar que ambos entenderam o mesmo.')
) as p(numero, titulo, conteudo, dica)
where t.titulo = 'Como definir metas que funcionam';

-- 4.8) Como revisar metas da semana anterior
insert into tutorial_passos (tutorial_id, numero, titulo, conteudo, dica)
select t.id, p.numero, p.titulo, p.conteudo, p.dica
from tutoriais t,
(values
  (1, 'Comece sempre por aqui', 'A Revisão é o segundo momento da reunião e existe pra fechar o ciclo da semana anterior antes de abrir compromissos novos. Pular esse passo ensina à equipe que metas são opcionais.', null),
  (2, 'Pergunte antes de afirmar', 'Mesmo que você ache que a meta não foi cumprida, abra perguntando: "Como foi com aquela meta que combinamos?". Você ganha contexto e a pessoa ganha voz.', 'Evite começar com "Você fez ou não fez?". Mude pra "Como foi tentar?".'),
  (3, 'Reconheça o que fechou', 'Meta cumprida merece elogio explícito no momento. Não acumule pra depois. Reconhecimento sai mais forte quando vem junto da confirmação.', null),
  (4, 'Trate o que não fechou', 'Se a meta não saiu, separe causa de desculpa. Houve obstáculo real que você pode ajudar a remover? Houve falta de prioridade? A conversa muda conforme a resposta.', null),
  (5, 'Decida o que fazer com ela', 'Cada meta não cumprida tem três caminhos: repetir na semana que entra, ajustar pra algo mais realista, ou abandonar porque mudou o contexto. Escolha um, deixe registrado.', 'Repetir a mesma meta três semanas seguidas sem progresso é sinal de algo mais profundo. Vale conversa em particular.')
) as p(numero, titulo, conteudo, dica)
where t.titulo = 'Como revisar metas da semana anterior';

-- 4.9) Como dar um elogio que funciona
insert into tutorial_passos (tutorial_id, numero, titulo, conteudo, dica)
select t.id, p.numero, p.titulo, p.conteudo, p.dica
from tutoriais t,
(values
  (1, 'Específico vence genérico', 'Elogio bom descreve o que foi feito. "Bom trabalho" some no ar; "vi como você acalmou aquele cliente irritado no sábado" fica. Quanto mais concreto, mais a pessoa entende o que repetir.', null),
  (2, 'No momento certo', 'Reconhecimento perde força quando vem semanas depois. Sempre que possível, elogie no dia. A reunião serve pra consolidar; o calor do momento é insubstituível.', 'Anote na hora se não puder falar, e leve pra reunião. Pior do que tarde é esquecer.'),
  (3, 'Diga por que importou', 'Não basta dizer o que a pessoa fez; conecte ao efeito. "Você atendeu rápido, e isso fez o cliente voltar". Faz o elogio virar lição replicável.', null),
  (4, 'Sem comparação com colegas', 'Evite "você foi melhor que o fulano". Compara cria competição interna e magoa o ausente. Elogio é sobre a pessoa, não sobre o ranking.', null),
  (5, 'Em público quando couber', 'Elogio coletivo, na frente da equipe, reforça padrão. Mas só se a pessoa não fica desconfortável com isso. Conheça seu time.', 'Algumas pessoas preferem reconhecimento em particular. Não menos sincero, só mais reservado.')
) as p(numero, titulo, conteudo, dica)
where t.titulo = 'Como dar um elogio que funciona';

-- 4.10) Como apontar algo a melhorar sem ferir
insert into tutorial_passos (tutorial_id, numero, titulo, conteudo, dica)
select t.id, p.numero, p.titulo, p.conteudo, p.dica
from tutoriais t,
(values
  (1, 'Fato antes de juízo', 'Descreva o que aconteceu observavelmente antes de dar nome. "Ontem você chegou 20 minutos depois" é fato; "você é relaxado com horário" é rótulo. Rótulo fere e fecha a conversa.', null),
  (2, 'Pergunte o contexto', 'Antes de concluir, abra espaço pra resposta. "Aconteceu algo?". Quase sempre há informação que muda o cenário. Mesmo quando não muda, a pessoa se sente ouvida.', 'Mesmo que você esteja 100% certo do que viu, a pergunta abre caminho pra mudança. Acusação direta endurece quem ouve.'),
  (3, 'Foque no impacto, não no caráter', 'Mostre o efeito do que aconteceu, não o tipo de pessoa que ela seria. "Quando você atrasa o turno fica curto pros colegas" é específico; "você é irresponsável" é destrutivo.', null),
  (4, 'Combine o próximo passo', 'Toda correção precisa terminar em algo prático. "O que dá pra fazer diferente na próxima vez?". Sem combinação, ficou só desabafo seu.', null),
  (5, 'Em particular quando for forte', 'Crítica direta dolorosa não vai pra frente do time. Mesmo que o erro tenha sido público, a correção pode ser reservada. Preserva a dignidade e mantém a autoridade.', 'Se a pessoa ficar emotiva, dê espaço. Não atropele com mais argumentos. Silêncio é parte da conversa.')
) as p(numero, titulo, conteudo, dica)
where t.titulo = 'Como apontar algo a melhorar sem ferir';

-- 4.11) Como usar as dicas da IA no Modo Reunião
insert into tutorial_passos (tutorial_id, numero, titulo, conteudo, dica)
select t.id, p.numero, p.titulo, p.conteudo, p.dica
from tutoriais t,
(values
  (1, 'Copiloto, não piloto', 'A IA da Bússola sugere abordagens em cada momento da reunião com base nas observações que você registrou. É apoio pra pensar, não roteiro pra ler. Quem conduz é você.', null),
  (2, 'Leia antes de falar', 'Cada momento tem um bloco de dica gerado pela IA. Dê uma lida rápida antes de abrir aquele momento com a equipe. Em 30 segundos você ganha um ângulo que talvez não tinha pensado.', 'A dica é particular sua. A equipe não vê. Use como cola, não como script.'),
  (3, 'Adapte pro seu jeito', 'A IA fala num tom neutro. Você fala do seu jeito. Pegue a ideia da dica e traduza pra forma como você conversa naturalmente com aquela pessoa.', null),
  (4, 'Discorde quando faz sentido', 'A IA não conhece o histórico íntimo da equipe. Se a sugestão soa errada pro contexto, ignore. Sua leitura humana sempre ganha.', 'Quando você ignora uma dica e dá certo, anote o porquê. Vira critério pra próxima vez.')
) as p(numero, titulo, conteudo, dica)
where t.titulo = 'Como usar as dicas da IA no Modo Reunião';

-- 4.12) Quando falar em particular x na reunião
insert into tutorial_passos (tutorial_id, numero, titulo, conteudo, dica)
select t.id, p.numero, p.titulo, p.conteudo, p.dica
from tutoriais t,
(values
  (1, 'Regra geral', 'Elogio pode ser público; crítica forte vai pra particular. Esse princípio sustenta o respeito dentro da equipe e protege a autoridade do gestor.', null),
  (2, 'Casos pra reunião coletiva', 'Combinados de processo, mudanças que afetam todos, padrões a celebrar, decisões compartilhadas. Tudo que precisa do grupo presente pra valer.', null),
  (3, 'Casos pra conversa particular', 'Performance individual fraca, conflito interpessoal, assuntos pessoais que afetam o trabalho, correção que pode constranger. Nada disso pertence à mesa da reunião.', 'Se você hesita em dizer algo na frente dos outros, é sinal de que aquele assunto pede particular. Confie na hesitação.'),
  (4, 'Como marcar uma conversa', 'Não anuncie como ameaça ("preciso falar com você sério"). Convide com naturalidade: "tem um minuto agora?". Combine hora se não for possível na hora.', null),
  (5, 'Volte pra reunião depois', 'Quando o assunto particular é resolvido, a próxima reunião deve refletir isso sem expor o que foi conversado. Trate o colaborador como se nada tivesse acontecido em frente aos demais.', null)
) as p(numero, titulo, conteudo, dica)
where t.titulo = 'Quando falar em particular x na reunião';

-- 4.13) Como ativar a coleta de feedback
insert into tutorial_passos (tutorial_id, numero, titulo, conteudo, dica)
select t.id, p.numero, p.titulo, p.conteudo, p.dica
from tutoriais t,
(values
  (1, 'Entenda o que é', 'A Bússola gera um link público que você compartilha com clientes finais. Eles avaliam o atendimento em estrelas, deixam um comentário opcional, podem citar quem atendeu, e participam de um sorteio de brindes.', null),
  (2, 'Vá em Configurações', 'Abra a seção de feedback de cliente nas Configurações. Lá você ativa o módulo e o sistema gera um link curto único pra sua empresa.', null),
  (3, 'Personalize a mensagem pós-feedback', 'Você pode editar a mensagem que aparece pro cliente depois que ele envia. É boa oportunidade pra agradecer e reforçar que a opinião dele será lida.', 'Mensagem curta funciona melhor. Algo como "obrigado, vamos ler com atenção" basta.'),
  (4, 'Compartilhe o link', 'Imprima em QR code no caixa, mande por WhatsApp depois do atendimento, ou coloque em material físico. O cliente abre sem precisar de cadastro.', null),
  (5, 'Acompanhe os feedbacks recebidos', 'Os retornos aparecem na aba Feedback de Clientes do painel. Você decide o que fazer com cada um: compartilhar com colaborador, virar observação interna ou só arquivar.', null)
) as p(numero, titulo, conteudo, dica)
where t.titulo = 'Como ativar a coleta de feedback';

-- 4.14) Como cadastrar brindes
insert into tutorial_passos (tutorial_id, numero, titulo, conteudo, dica)
select t.id, p.numero, p.titulo, p.conteudo, p.dica
from tutoriais t,
(values
  (1, 'Por que oferecer brinde', 'Cliente que sabe que vai concorrer a algo participa mais. O brinde não precisa ser caro; precisa ser percebido como gesto. A devolutiva sincera vale o gesto.', null),
  (2, 'Vá na seção de brindes', 'Dentro de Configurações, na área de feedback de cliente, existe a lista de brindes. Cada brinde tem nome, descrição curta e peso (probabilidade no sorteio).', null),
  (3, 'Use o peso pra balancear', 'Brindes mais comuns recebem peso maior; brindes raros, peso menor. Assim você sorteia algo barato com frequência e algo caro de vez em quando, sem quebrar o caixa.', 'Comece com 3 ou 4 brindes simples. Você ajusta conforme o uso revela o que funciona melhor.'),
  (4, 'Ative só os que estão disponíveis', 'Cada brinde tem toggle ativo/inativo. Quando acaba o estoque ou você quer pausar, desative em vez de deletar. Histórico fica preservado.', null),
  (5, 'Combine entrega com a equipe', 'Quando o cliente ganha um brinde, ele recebe um código de resgate. Sua equipe precisa saber como conferir o código e entregar. Combine no Modo Reunião.', null)
) as p(numero, titulo, conteudo, dica)
where t.titulo = 'Como cadastrar brindes';

-- 4.15) Como compartilhar feedback com a equipe
insert into tutorial_passos (tutorial_id, numero, titulo, conteudo, dica)
select t.id, p.numero, p.titulo, p.conteudo, p.dica
from tutoriais t,
(values
  (1, 'Por que compartilhar', 'A voz do cliente cega quando fica só com o gestor. Quando o colaborador lê o que o cliente disse dele, em palavras do próprio cliente, o aprendizado é diferente do que se você fosse intermediar.', null),
  (2, 'Abra a aba de feedbacks', 'Na seção Feedback de Clientes do painel, cada item mostra estrelas, comentário, e o colaborador citado quando há um.', null),
  (3, 'Use o botão de compartilhar', 'Cada feedback com colaborador citado tem botão pra compartilhar diretamente com aquela pessoa. Em um clique, o feedback aparece no link público dela como uma seção separada das suas anotações.', 'Compartilhe tanto elogios quanto críticas. Equipe que só vê elogio do cliente perde calibragem.'),
  (4, 'Vire observação interna se quiser', 'Você também pode transformar um feedback em observação interna sua, escolhendo se é individual ou pra discutir com a equipe inteira. Bom pra feedbacks que merecem entrar na próxima reunião.', null),
  (5, 'Não compartilhe tudo', 'Feedback ofensivo ou injusto não precisa chegar pro colaborador. Filtre. Você é a primeira camada de proteção do time contra cliente desequilibrado.', null)
) as p(numero, titulo, conteudo, dica)
where t.titulo = 'Como compartilhar feedback com a equipe';

-- 4.16) Como transformar feedback em melhoria real
insert into tutorial_passos (tutorial_id, numero, titulo, conteudo, dica)
select t.id, p.numero, p.titulo, p.conteudo, p.dica
from tutoriais t,
(values
  (1, 'Dado solto não vira nada', 'Feedback que entra no sistema e não vira ação é só arquivo. A diferença entre coleta de feedback útil e inútil é o que você faz com ele depois.', null),
  (2, 'Procure padrões, não casos isolados', 'Um cliente reclamando da espera pode ser exceção. Três clientes na mesma semana é sintoma. Olhe o conjunto antes de mudar processo.', 'Reserve 10 minutos por semana pra ler os feedbacks acumulados de uma vez. Padrão fica claro só na visão de bloco.'),
  (3, 'Traga pra reunião o que afeta o grupo', 'Padrão que envolve a operação como um todo é assunto coletivo. No momento Equipe da reunião, abra os feedbacks como dado e pergunte ao time como atacar.', null),
  (4, 'Trate o individual com a pessoa', 'Feedback negativo que cita um colaborador específico vira conversa particular, não exposição pública. Use o que ouviu como ponto de partida, não como sentença.', null),
  (5, 'Volte pro cliente quando for grave', 'Feedback ruim com identificação merece resposta. Não dentro da Bússola necessariamente, mas pelo canal pelo qual você chega no cliente. Mostra que a opinião dele foi lida.', 'Cliente que recebe resposta pra reclamação volta. Cliente ignorado some calado.')
) as p(numero, titulo, conteudo, dica)
where t.titulo = 'Como transformar feedback em melhoria real';

-- 4.17) Como adicionar a logo da empresa
insert into tutorial_passos (tutorial_id, numero, titulo, conteudo, dica)
select t.id, p.numero, p.titulo, p.conteudo, p.dica
from tutoriais t,
(values
  (1, 'Por que importa', 'A logo aparece no painel, no link de cada colaborador, na página de feedback de cliente e nos ícones quando alguém salva como atalho no celular. É a sua marca presente em cada toque com a Bússola.', null),
  (2, 'Prepare a imagem', 'Use imagem quadrada de pelo menos 200 por 200 pixels, em JPG, PNG ou WebP, até 1 MB. Imagem horizontal fica cortada; redonda fica esquisita. Quadrada e centrada funciona em tudo.', 'Se sua logo original é horizontal, faça uma versão quadrada com fundo neutro pra usar aqui.'),
  (3, 'Vá em Configurações', 'Na tela de Configurações, existe a seção Identidade Visual. Ali você envia ou troca a logo.', null),
  (4, 'Envie e confira', 'Ao subir, a logo aparece imediatamente nas telas que dependem dela. Se algo ficou estranho, troque por outra imagem; a anterior é substituída.', null),
  (5, 'Remova quando precisar', 'Se quiser voltar pro padrão (iniciais da empresa em fundo bege), tem botão de remover na mesma seção. Sem perda de dado.', null)
) as p(numero, titulo, conteudo, dica)
where t.titulo = 'Como adicionar a logo da empresa';

-- 4.18) Como ajustar dia e hora da reunião
insert into tutorial_passos (tutorial_id, numero, titulo, conteudo, dica)
select t.id, p.numero, p.titulo, p.conteudo, p.dica
from tutoriais t,
(values
  (1, 'A reunião é semanal por design', 'A Bússola foi pensada pra um ciclo de uma semana. Frequência menor perde calor; maior cansa a equipe. Defina um dia fixo e proteja como compromisso real.', null),
  (2, 'Escolha o dia com cuidado', 'Evite segunda muito cedo (semana ainda não rodou) e sexta no fim do dia (todo mundo querendo ir embora). Meio de semana, no começo do turno, costuma render mais.', 'Pergunte à equipe qual dia funciona melhor pra eles. Não precisa ser unanimidade, mas evite atropelar.'),
  (3, 'Ajuste o tom da IA', 'Nas configurações, você escolhe o tom da IA: direto, acolhedor ou motivacional. Direto é mais seco e objetivo; acolhedor é mais cuidadoso; motivacional é mais energético. Teste qual combina com você.', null),
  (4, 'Mantenha o ritmo', 'Mais importante que o dia escolhido é manter. Equipe que sabe que toda quarta às 9h tem reunião se organiza. Reunião que muda toda semana vira reunião que ninguém leva a sério.', null)
) as p(numero, titulo, conteudo, dica)
where t.titulo = 'Como ajustar dia e hora da reunião';

-- 4.19) Como personalizar categorias de observação
insert into tutorial_passos (tutorial_id, numero, titulo, conteudo, dica)
select t.id, p.numero, p.titulo, p.conteudo, p.dica
from tutoriais t,
(values
  (1, 'Pra que servem as categorias', 'Categoria etiqueta cada observação por tema. Atendimento, Pontualidade, Iniciativa, etc. Ajuda quando você quer filtrar o histórico de alguém ou ver padrões da equipe.', null),
  (2, 'Comece com as padrão', 'A Bússola vem com um conjunto de categorias que cobre a maioria dos casos. Use sem mudar nada por algumas semanas pra sentir o que falta.', 'Categoria inventada antes da hora gera mais confusão do que organização. Use as padrão até elas incomodarem.'),
  (3, 'Personalize quando fizer falta', 'Se sua operação tem um aspecto recorrente que nenhuma categoria padrão cobre, crie a sua. Nas Configurações de IA existe a lista de categorias pra editar.', null),
  (4, 'Menos é mais', 'Lista grande demais torna escolher categoria um trabalho extra. Mantenha entre 5 e 10. Quando alguma categoria fica sem uso por meses, remova.', null),
  (5, 'Categoria é opcional, sempre', 'Mesmo com a lista personalizada, você pode registrar observação sem categoria. Quando o tema não encaixa em nada, deixa em branco. Não force.', 'Categoria é pra ajudar você depois, não pra te emperrar no momento de registrar.')
) as p(numero, titulo, conteudo, dica)
where t.titulo = 'Como personalizar categorias de observação';

-- 4.20) Como gerenciar colaboradores
insert into tutorial_passos (tutorial_id, numero, titulo, conteudo, dica)
select t.id, p.numero, p.titulo, p.conteudo, p.dica
from tutoriais t,
(values
  (1, 'Adicionar é simples', 'Na lista de Colaboradores, há botão pra novo cadastro. Preencha nome e, se quiser, foto e telefone. O link público é gerado automaticamente.', null),
  (2, 'Editar a qualquer momento', 'Abra o perfil do colaborador e use a opção de editar pra trocar nome, foto ou telefone. As alterações refletem na hora em todos os lugares onde o nome aparece.', null),
  (3, 'Desligar sem perder histórico', 'Quando alguém sai da equipe, marque como desligado em vez de excluir. O link daquela pessoa para de funcionar pra ela, mas o histórico fica acessível pra você consultar quando precisar.', 'Histórico de quem saiu vale ouro pra entender padrões da sua operação. Não delete.'),
  (4, 'Reativar quando voltar', 'Se um ex-colaborador volta, basta reativar pelo perfil. O link volta a funcionar com o histórico antigo preservado e novo histórico se acumula em sequência.', null),
  (5, 'Foto não é obrigatória', 'A foto ajuda a humanizar a lista, mas não é necessária. Quando não tem foto, a Bússola mostra as iniciais em fundo bege. Funciona igual.', null)
) as p(numero, titulo, conteudo, dica)
where t.titulo = 'Como gerenciar colaboradores';
