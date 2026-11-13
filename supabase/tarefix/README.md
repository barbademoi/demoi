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
