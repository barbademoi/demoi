# Tarefix

Checklist diário de tarefas por colaborador. Produto **separado** que roda **dentro**
do BarberMeta:

- **Site:** mesmo projeto da Vercel, na rota `/tarefix` (colaborador em `/tarefix/c/[token]`).
- **Banco:** mesmo projeto Supabase, mas tudo no schema **`tarefix`** (nada no `public`,
  exceto a função marcadora `public.tarefix_instalado()`). Buckets `tarefix-provas` e
  `tarefix-midia`. Nenhuma tabela do BarberMeta é lida ou alterada.
- **Código:** `app/tarefix`, `components/tarefix`, `lib/tarefix`, `supabase/tarefix`.
  Estilos isolados em `app/tarefix/tarefix.css` (classes `tf-*`, cores `tf-*` no Tailwind).
- **Pontos de contato com o BarberMeta:** `middleware.ts` deixa `/tarefix` passar (o Tarefix
  cuida do próprio acesso); `MetaPixel` não dispara em `/tarefix`; `next.config.mjs` importa
  `.sql` como texto e manda `/tarefix` sem cache; `tailwind.config.ts` ganhou as cores `tf`.

## Etapas

- [x] **1. Supabase** — tabelas, RLS, buckets e instalação guiada em `/tarefix/instalar`
- [x] **2. Painel do dono** — login (`/tarefix/entrar`), funções, equipe (foto, link, PIN, WhatsApp, folgas, ativar/desativar), tarefas recorrentes (arrastar para ordenar) e avulsas, ajustes da empresa
- [x] **3. Colaborador** — `/tarefix/c/[token]` + PIN (cookie assinado de 30 dias, bloqueio de 5 min após 5 erros), tela Hoje com check, foto pela câmera (upload direto ao bucket privado por URL assinada), termômetros do dia e do mês, tarefas reprovadas com motivo e registro de extras
- [x] **4. Painel Hoje do dono** — termômetro da equipe, card por colaborador (termômetro, fotos, tarefas), reprovar com motivo e desfazer, aprovar/recusar extras, sininho de avisos e resumo diário do fechamento gerado sem cron (na primeira abertura depois do horário)
- [x] **5. Mês e mensagens** — colaborador: aba Meu mês (calendário colorido pelo % do dia, extras, níveis de bônus), mensagens sorteadas por momento e tom sem repetir no dia (`lib/tarefix/mensagens.ts`), confete no dia 100%; dono: Mês (termômetros, quem está em cada nível de bônus, Fechar mês só para meses encerrados), Histórico (colaborador + data, com reprovação enquanto o mês estiver aberto), bônus em Ajustes
- [x] **6. Tema e PWA** — chave Sistema/Claro/Escuro (Ajustes do dono e cabeçalho do colaborador, salva no aparelho, sem piscar), manifesto por colaborador (o ícone na tela inicial abre direto no link dele) e do painel, ícones 192/512/maskable/Apple em `public/tarefix`, dica de instalação no celular, fonte hospedada em `app/tarefix/fontes`

## Melhorias depois da V1

- **Prazo e tempo estimado** (`004_horario_tempo.sql`, `lib/tarefix/prazo.ts`): cada tarefa (recorrente
  ou avulsa) pode ter "fazer até HH:MM" e "tempo estimado" em minutos, copiados para o dia como o título.
  A lista do dia fica ordenada pelo prazo; pendente depois do prazo aparece como **atrasada** (não muda o
  %); feita depois do prazo registra quantos minutos atrasou. O colaborador vê o tempo previsto das
  pendentes; o painel mostra atrasadas e o total previsto por pessoa.
- **Hora de começar** (`005_horario_inicio.sql`): com o tempo estimado monta o fluxo do dia (09:00–09:15).
  Sem "fazer até", o fim previsto vira o prazo do atraso. A lista segue a ordem dos horários e destaca a
  tarefa da vez com **agora**.
- **Tarefas do dia todo, peso e autoavaliação** (`006_tarefas_dia_todo.sql`, `lib/tarefix/continuas.ts`):
  tarefa marcada como "vale o dia todo" (atendimento, comandas, verificar algo) fica fixa no topo, em
  roxo, sem horário; o check só libera X min antes do fechamento (Ajustes, padrão 60) e, ao confirmar,
  o colaborador arrasta uma setinha de autoavaliação (Difícil → Excelente, não entra no %). Toda tarefa
  pode ter **peso 1, 2 ou 3** no percentual (soma dos pesos feitos ÷ soma dos pesos).
- **Observações do colaborador** (`007_observacoes.sql`): balão em cada tarefa (feita ou não, inclusive
  as do dia todo) para um texto de até 200 caracteres, editável até o dia fechar. Gera aviso no sininho
  (um por tarefa; editar atualiza e volta a não lido; apagar remove). Aparece no painel e no histórico.
- **Termômetro metálico**: cores mais fortes (#E11D2E → #F59E0B → #16A34A), brilho metálico na parte
  alcançada (com reflexo animado que respeita "reduzir movimento"), trilho de metal e marcador em
  forma de botão metálico; o calendário do mês usa o mesmo acabamento.
- **Depois do horário de fechamento**: o colaborador ainda pode marcar, desmarcar e comentar as tarefas
  de HOJE até a meia-noite (dias anteriores seguem travados). Conta no percentual, mas aparece como
  **fora do horário** (derivado de `feita_em` × horário de fechamento) no celular, no painel e no
  histórico. Ele vê um aviso fixo e, na primeira marcação fora do horário do dia, um alerta lembrando
  que o check é todos os dias até o fechamento. O resumo do fechamento continua sendo o retrato do
  momento em que o painel foi aberto depois do horário.
- **Notificações push no celular** (`008_push.sql`, `lib/tarefix/push.ts`, `lib/tarefix/pushAgendado.ts`,
  `public/tarefix/sw.js`): Web Push com VAPID. As chaves são geradas pelo servidor na primeira vez e
  guardadas em `tarefix.push_config` (só service role) — nada para configurar na Vercel.
  - Colaborador ativa no próprio link; dono ativa em Ajustes (com botão de teste). iPhone: só com o
    Tarefix na tela inicial (iOS 16.4+).
  - Imediatas: tarefa reprovada (colaborador) e extra nova (dono).
  - Agendadas: `/tarefix/api/push/tick`, chamado a cada 5 min pelo **pg_cron + pg_net do Supabase**
    com o cabeçalho `x-tarefix-cron` = `push_config.segredo_cron`. Avisos: na hora de começar cada
    tarefa (tolerância 10 min), 30 min antes do fechamento com pendentes, resumo ao dono até 1h
    depois do fechamento. `push_enviados` garante que cada aviso sai uma vez só.
  - Ajustes liga/desliga cada tipo (`empresas.push_tipos`).
  - Para (re)criar o agendamento no SQL Editor:
    ```sql
    create extension if not exists pg_net;
    create extension if not exists pg_cron;
    select cron.schedule('tarefix-push-tick', '*/5 * * * *', $$
      select net.http_get(
        url := 'https://www.barbermeta.com.br/tarefix/api/push/tick',
        headers := jsonb_build_object('x-tarefix-cron', (select segredo_cron from tarefix.push_config where id = 1))
      )
    $$);
    ```
- **Mês = prévia do mês inteiro** (`lerMes` com `previsao`): percentual = pontos feitos até agora ÷
  pontos de TODAS as tarefas do mês — as que já existem nos dias que passaram (e hoje) + as previstas
  para os dias que faltam (recorrentes ativas e avulsas já criadas, a partir do cadastro, sem folgas).
  O termômetro enche ao longo do mês e fecha em 100% se tudo for feito; aparece "Faltam X tarefas em
  Y dias". Meses passados (e o fechamento) usam só o que aconteceu. A comparação com o mês passado usa o
  ritmo dos dias até hoje. Com peso, os textos mostram **pontos** ("23 de 41 pontos").
- **Dias anteriores na aba Hoje**: setas ‹ › para consultar até 60 dias para trás (desde o cadastro),
  só leitura: tarefas, horários, fora do horário, fotos, observações e extras.
- **Push "tarefa concluída"** para o dono (liga/desliga em Ajustes); o aviso de cada colaborador
  substitui o anterior na tela.
- **Botão atualizar** (`components/tarefix/BotaoAtualizar.tsx`): no painel (cabeçalho e lateral) e na
  tela do colaborador. Também atualiza sozinho quando o app volta para a frente e de tempos em tempos
  enquanto visível (painel 60 s, colaborador 120 s, sem atrapalhar uma marcação em andamento).
- **Dias anteriores no painel do dono**: setas ‹ › na tela Hoje (`/tarefix/painel?d=AAAA-MM-DD`, até 60
  dias), com os cards de cada colaborador daquele dia; dá para reprovar enquanto o mês não fechar.
- **Acessos de mentorados** (`009_acessos.sql`, `lib/tarefix/acessos.ts`, `/tarefix/painel/acessos`):
  `tarefix.admins` guarda quem pode conceder acesso (o primeiro dono instalado; só service role lê).
  "Conceder acesso" cria uma empresa nova + o dono dela: e-mail novo ganha conta com senha provisória
  (mostrada uma vez, com botões Copiar / WhatsApp); e-mail que já tem conta no BarberMeta só é ligado, a
  senha não muda. Cada mentorado vê só a própria empresa (RLS). Suspender (`empresas.ativo = false`)
  bloqueia o dono (tela "acesso suspenso"), os links da equipe e os pushes — os dados ficam guardados.
  Para adicionar outro admin: `insert into tarefix.admins (user_id) values ('<id do auth.users>');`
- **Trocar senha** em Ajustes → Conta (vale também para o BarberMeta).
- **Como usar** (`/tarefix/painel/como-usar`, guia da equipe público em `/tarefix/ajuda`): passo a passo
  com exemplos de barbearia, simulações do termômetro, "assim não / assim sim", rotina e dúvidas; checklist
  "Seu progresso" com dados reais. Dicas "?" nos campos (`components/tarefix/Dica.tsx`, textos em
  `components/tarefix/dicas.tsx`): passar o mouse no computador, tocar no celular.
- **Sugestões de tarefas** (`lib/tarefix/sugestoes.ts`, botão "✨ Sugestões" em Tarefas): as tarefas
  recorrentes ativas da empresa do admin (de colaboradores ativos), lidas ao vivo, agrupadas pela função de
  quem faz e sem repetir título. Todo mentorado (atual e futuro) escolhe e copia para um colaborador
  (`adicionarSugestoes`): a cópia leva dias, horários, tempo, peso, dia todo, foto e descrição, e pula o que
  ele já tem com o mesmo título. Mudou uma tarefa na empresa do admin? As sugestões mudam na hora; as
  cópias já feitas não mudam.
- **Meu dia** (`010_meu_dia.sql`, `lib/tarefix/meuDia.ts`, `/tarefix/painel/meu-dia`): o dono usa o Tarefix
  para si através de um "colaborador" especial (`colaboradores.eh_dono`, `dono_id`), sem PIN (só abre com o
  login do próprio dono), fora da equipe, do painel, do mês, do resumo e das sugestões. O dia dele vai até
  23:59 e as tarefas do dia todo liberam às 18h. Sem equipe, o painel abre direto no Meu dia e o menu fica
  enxuto. Recursos: adicionar rápido (hoje, amanhã ou "Algum dia" = avulsa sem data), adiar (+1h, hoje à
  noite, amanhã → status `adiada`, que não conta no %; horário mudado só no dia fica com `ajustada`),
  avulsa não feita passa para o dia seguinte (`veio_de`), categorias com cor (`tarefix.categorias`, 4
  padrão), checklist (também para a equipe), sequência 🔥 e rotina pronta de dono
  (`lib/tarefix/rotinaDono.ts`, em Tarefas → Eu → Sugestões). Lembretes (`empresas.pessoal`, Ajustes → Meu
  dia), no tick de push, para o celular do dono: X min antes, na hora, insistente (+30 e +60), resumo da
  manhã e da noite.
- **Cadastro público** (`/tarefix/criar-conta`, `lib/tarefix/cadastro.ts`): "Só para mim" ou "Com minha
  equipe". Conta nova recebe `app_metadata.tarefix_only` e o `middleware.ts` do BarberMeta a manda de volta
  para /tarefix (vale também para mentorados com e-mail novo; a 010 marcou os que já existiam sem cadastro
  no BarberMeta). Limite: 3 cadastros por IP/hora e 300/dia (`tarefix.cadastros`) + campo-isca. E-mail que
  já tem conta (ex.: BarberMeta) entra normalmente e cria o Tarefix em um toque na tela "sem acesso".
- **Aviso "com cara de alarme" + botões** (`public/tarefix/sw.js`, `lib/tarefix/acaoPush.ts`,
  `/tarefix/api/push/acao`): avisos de tarefa ficam na tela até mexer (`requireInteraction`) e vibram forte.
  Botões: "✓ Feito" (não vale para tarefa com foto nem do dia todo) e, no Meu dia, "⏰ Adiar 15 min". O
  service worker não tem sessão: cada notificação leva um passe HMAC da tarefa, válido por 24h.
- **Agenda do celular** (`lib/tarefix/agenda.ts`, `/tarefix/agenda/[id]/[chave]/tarefix.ics`): feed .ics
  com as tarefas com horário de hoje (pendentes) e dos próximos 14 dias, com alerta nativo 15 min antes.
  A chave é derivada do token do colaborador (gerar link novo invalida a agenda). Botão "📅 Pôr na agenda
  do celular" no Meu dia e na tela de cada colaborador (iPhone: webcal; Google Agenda: link `cid`).
- **Mentoria** (`011_mentoria.sql`, `lib/tarefix/mentoria.ts`, `/tarefix/painel/mentoria`, link
  `/tarefix/m/[token]`): só o admin. Mentorados não precisam de conta: recebem um link secreto (sem PIN;
  "gerar novo link" invalida o antigo e desliga o aparelho dele). Missões `data` (uma vez), `dias` (nos dias
  da semana, cada dia uma entrega) ou `semanal` (prazo num dia da semana), com hora opcional, prova
  (nenhuma/foto/texto), aprovação opcional e vários mentorados por missão. As `entregas` são geradas sob
  demanda (30 dias para trás, 7 à frente); pausar/tirar o mentorado apaga só as pendentes. Reunião: data,
  hora e link. Lembretes no tick: 2 dias antes e no dia (9h, ou 2h antes da hora), cobrança diária de
  atrasadas (9h–21h), aviso ao admin quando atrasa (uma vez por entrega, também no sininho), reunião 1 dia e
  1 hora antes para os dois. Tudo pela service role; as tabelas não têm policy para o dono comum.
- **Datas futuras** (`012_periodo.sql`, `lib/tarefix/periodo.ts`): recorrentes (equipe e Meu dia) e missões
  recorrentes da mentoria têm "Começa em" e "Termina em" opcionais (`inicio`/`fim`), respeitados na geração do
  dia, na prévia do mês, na agenda .ics e nas entregas. No Meu dia, o adicionar rápido e o "Algum dia" têm
  "Escolher data", e a lista "📅 Próximos dias" mostra as avulsas já agendadas (60 dias).
- **Checklist em todo lugar** (`013_checklist_missoes.sql`): missões da mentoria têm checklist (`missoes.checklist`
  → `entregas.checklist`), marcado pelo mentorado no link; editar a missão alinha as entregas abertas sem perder
  o que já foi marcado. No painel Hoje do dono, cada tarefa com checklist mostra "checklist 2/4" e os itens no
  detalhe (o checklist dos colaboradores já existia desde o Meu dia).
- **Termômetro "instrumento"**: moldura de aço grafite, trilho escuro, cores profundas (rubi → ouro
  velho → esmeralda) com reflexo cromado, marcas em 25/50/75 e marcador de aço.

## Instalar (pelo navegador)

Depois do deploy, abra `https://www.barbermeta.com.br/tarefix/instalar` e siga a tela:

1. Conexão — usa as mesmas chaves do BarberMeta (já estão na Vercel).
2. **Copiar SQL** → colar no SQL Editor do Supabase → Run.
3. Supabase → Settings → Data API → **Exposed schemas** → adicionar `tarefix` → Save.
4. Criar a conta de dono (pode ser o mesmo e-mail do BarberMeta, com a mesma senha;
   a senha nunca é trocada). Só funciona enquanto não existe nenhum dono.

`/tarefix/status` mostra o diagnóstico completo.

## Decisões do banco

- Toda tabela tem `empresa_id`; RLS libera ao dono só a própria empresa (`tarefix.minha_empresa()`).
  Usuários do BarberMeta sem cadastro em `tarefix.donos` não veem nada.
- Colaborador **não** usa Supabase Auth: as rotas validam token + cookie do PIN e usam a
  service role. `anon` não tem nenhuma permissão no schema.
- `tarefas_dia` copia título/descrição/exige_foto do modelo (editar o modelo não muda o passado).
- Gatilhos: mês fechado trava `tarefas_dia`, `extras`, `folgas` e `tarefas_avulsas`; marcar
  folga apaga as tarefas daquele dia; reprovação exige motivo; colaborador/função sempre da
  mesma empresa.
- Campos além do briefing: `colaboradores.pin_tentativas`/`pin_bloqueado_ate`, `avisos.chave`
  (não duplicar o resumo diário) e `avisos.link`.
- Datas do dia sempre em `America/Sao_Paulo` (`lib/tarefix/datas.ts` e `tarefix.hoje_sp()`).
- Geração das tarefas (`lib/tarefix/tarefasDia.ts`): sem cron, roda ao abrir o dia/mês. Dia fechado que
  já tem tarefas não muda mais; dia passado nunca aberto é gerado uma vez só com os modelos que já
  existiam naquele dia; hoje (antes do fechamento) sincroniza as pendentes com os modelos atuais.
- Segredo do cookie do PIN: `TAREFIX_SESSION_SECRET` se existir; senão derivado da service role.
