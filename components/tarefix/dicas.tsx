/**
 * Textos das dicas "?" do Tarefix — explicação curta + exemplo real.
 * Usados nos formulários (passando o mouse / tocando) e no guia "Como usar".
 */

type DicaTexto = { dica: React.ReactNode; exemplo?: React.ReactNode }

export const DICAS = {
  /* ------------------------------ tarefas ------------------------------ */
  titulo: {
    dica: <p>Comece com um verbo e diga o que fica pronto. O colaborador lê isso correndo, no meio do expediente.</p>,
    exemplo: <>“Limpar e desinfetar as máquinas” em vez de “Máquinas”.</>,
  },
  descricao: {
    dica: <p>O passo a passo ou o padrão esperado. Aparece quando o colaborador abre a tarefa. Ótimo para quem é novo na equipe.</p>,
    exemplo: <>“Tirar os pentes, escovar, borrifar o desinfetante e deixar secar 5 min. Guardar na gaveta 2.”</>,
  },
  dias: {
    dica: <p>A tarefa aparece sozinha em todos os dias marcados, toda semana. Dia de folga do colaborador não gera tarefa.</p>,
    exemplo: <>“Lavar as toalhas” só em Ter e Sex; “Abrir a loja” de Seg a Sáb.</>,
  },
  diaTodo: {
    dica: (
      <>
        <p>Para o que não tem um “check” rápido: vale do primeiro ao último cliente. Fica fixa no topo, com outra cor.</p>
        <p>O colaborador só confirma perto do fechamento (veja em Ajustes quanto tempo antes) e diz como foi: Difícil, Fraco, Ok, Bom ou Excelente.</p>
      </>
    ),
    exemplo: <>“Atender com o padrão da casa: café, toalha quente e oferecer o próximo horário.”</>,
  },
  peso: {
    dica: (
      <>
        <p>Quanto a tarefa vale no percentual do dia. 1× = uma tarefa comum; 3× = vale por três.</p>
        <p>Use peso maior no que mais importa para o cliente ou para o caixa.</p>
      </>
    ),
    exemplo: (
      <>
        5 tarefas de 1× + o atendimento de 3× = 8 pontos. Se fizer as 5 e falhar no atendimento: 5 de 8 = <b>63%</b>, e não 83%.
      </>
    ),
  },
  inicio: {
    dica: <p>Hora em que a tarefa deve começar. Organiza a lista na ordem do dia e, com notificações ligadas, o colaborador recebe um aviso nessa hora.</p>,
    exemplo: <>“Abrir a loja” começa às 08:50.</>,
  },
  tempo: {
    dica: <p>Quanto tempo a tarefa leva, em minutos. Junto com o “Começar às”, calcula o fim previsto. Ajuda o colaborador a se planejar.</p>,
    exemplo: <>Começa 19:30 + 15 min = fim previsto 19:45.</>,
  },
  prazo: {
    dica: (
      <>
        <p>Hora limite. Depois dela, a tarefa aparece como <b>atrasada</b> (para você e para o colaborador). Ainda dá para marcar, e isso não muda o percentual.</p>
        <p>Sem “fazer até”, o atraso conta a partir do fim previsto.</p>
      </>
    ),
    exemplo: <>“Conferir a agenda do dia” até 09:15, antes do primeiro cliente.</>,
  },
  foto: {
    dica: <p>A tarefa só conclui com uma foto tirada na hora, pela câmera. A foto aparece no seu painel. Use quando quiser ver o resultado.</p>,
    exemplo: <>“Bancadas limpas no fechamento”: a foto mostra se ficou mesmo limpo.</>,
  },
  ativa: {
    dica: <p>Pausar tira a tarefa dos próximos dias sem apagar. Os dias que já passaram continuam iguais.</p>,
    exemplo: <>Pause “Montar a vitrine de Natal” em janeiro e reative em dezembro.</>,
  },
  recorrentes: {
    dica: <p>Tarefas que se repetem toda semana nos dias escolhidos. Arraste pelos pontinhos ⋮⋮ para mudar a ordem em que aparecem.</p>,
    exemplo: <>Abrir a loja, limpar as máquinas, postar stories, fechar o caixa.</>,
  },
  avulsas: {
    dica: <p>Tarefas de um dia só. Aparecem apenas na data escolhida e somam no percentual daquele dia.</p>,
    exemplo: <>“Receber o fornecedor de pomadas” na quinta, dia 20.</>,
  },
  dataAvulsa: {
    dica: <p>O dia em que a tarefa aparece. Pode ser hoje: entra na lista do colaborador na hora.</p>,
    exemplo: <>Hoje, para “Trocar a lâmpada do lavatório”.</>,
  },

  /* ------------------------------ empresa ------------------------------ */
  fechamento: {
    dica: (
      <>
        <p>Até essa hora a equipe deve dar todos os checks do dia. Depois dela ainda dá para marcar até a meia-noite, mas fica registrado como <b>fora do horário</b>.</p>
        <p>À meia-noite o dia fecha: o que ficou pendente conta como não feito.</p>
      </>
    ),
    exemplo: <>Barbearia que fecha às 20h: coloque 20:00 (ou 20:30 para dar tempo de fechar o caixa).</>,
  },
  liberarDiaTodo: {
    dica: <p>Quanto tempo antes do fechamento o colaborador pode confirmar as tarefas “do dia todo”. Antes disso, o botão fica travado, para ninguém confirmar o atendimento às 9h da manhã.</p>,
    exemplo: <>Fechamento 20:00 + 60 min = libera às 19:00.</>,
  },
  tom: {
    dica: <p>O jeito das mensagens que a equipe vê (parabéns, lembretes, dia 100%). Não muda nada nas regras.</p>,
    exemplo: <>Zoeira: “Dia 100%. Pode sair andando em câmera lenta.” · Neutro: “Dia 100%. Ótimo trabalho!”</>,
  },

  /* ------------------------------- bônus ------------------------------- */
  bonus: {
    dica: <p>Premia quem atingir um percentual no mês. O valor final é calculado quando você fecha o mês.</p>,
    exemplo: <>90% → R$ 50 · 100% → R$ 100.</>,
  },
  bonusMostrar: {
    dica: <p>O colaborador vê os níveis no “Meu mês” e quanto falta para o próximo. Motiva mais quando a meta está à vista.</p>,
    exemplo: <>“Faltam 4 pontos para o nível de R$ 100.”</>,
  },
  bonusNiveis: {
    dica: <p>Até 5 níveis. Vale o maior nível alcançado. O prêmio é um texto livre: pode ser dinheiro, folga ou um brinde.</p>,
    exemplo: <>80% → “1 corte grátis” · 95% → “R$ 80” · 100% → “R$ 150 + sábado de folga”.</>,
  },

  /* ---------------------------- colaboradores --------------------------- */
  pin: {
    dica: <p>4 números que o colaborador digita na primeira vez que abre o link (e se trocar de celular). Passe pessoalmente, nunca junto com o link.</p>,
    exemplo: <>Errou 5 vezes? O link trava por 5 minutos. Trocar o PIN destrava na hora.</>,
  },
  funcao: {
    dica: <p>O cargo do colaborador (Atendimento, Barbeiro, Recepção…). Aparece ao lado do nome no painel e ajuda a organizar a equipe.</p>,
    exemplo: <>Lucas → Barbeiro; Ana → Recepção.</>,
  },
  acesso: {
    dica: (
      <>
        <p>Cada colaborador tem um link só dele. Mande pelo WhatsApp e passe o PIN pessoalmente.</p>
        <p><b>Gerar novo link</b>: o antigo para de funcionar na hora. Use se o celular foi perdido ou a pessoa saiu da equipe.</p>
      </>
    ),
    exemplo: <>O Lucas trocou de celular: só abrir o mesmo link no novo e digitar o PIN.</>,
  },
  folgas: {
    dica: <p>Toque nos dias de folga ou férias. Nesses dias não aparecem tarefas e o dia não pesa contra o percentual do mês.</p>,
    exemplo: <>Ana folga toda segunda e tira férias de 10 a 20: marque esses dias.</>,
  },

  /* ----------------------------- termômetros ---------------------------- */
  termoHoje: {
    dica: <p>Quanto do dia já foi feito, contando o peso de cada tarefa. Atualiza a cada check.</p>,
    exemplo: <>4 de 8 pontos feitos = 50%.</>,
  },
  termoMes: {
    dica: (
      <>
        <p>Prévia do mês inteiro: o que já foi feito dividido por <b>todas</b> as tarefas do mês, inclusive as dos dias que ainda vão chegar.</p>
        <p>Começa baixo e vai enchendo; fecha em 100% se tudo for feito.</p>
      </>
    ),
    exemplo: <>Dia 10: 95 pontos feitos de 260 previstos no mês = 37%. Faltam 165 em 16 dias.</>,
  },
  termoEquipe: {
    dica: <p>A soma de toda a equipe no dia, com os pesos. Logo abaixo, cada colaborador tem o seu termômetro e a lista do dia.</p>,
    exemplo: <>Lucas 8 de 10 + Ana 6 de 6 = 14 de 16 pontos = 88%.</>,
  },

  /* ------------------------- tela do colaborador ------------------------ */
  diaTodoEquipe: {
    dica: (
      <>
        <p>Essas tarefas valem o expediente inteiro, por isso pesam mais no seu percentual. Não tem check agora: perto do fechamento o botão libera.</p>
        <p>Aí você toca, diz com sinceridade como foi (Difícil, Fraco, Ok, Bom ou Excelente) e confirma. A sua avaliação não muda o percentual.</p>
      </>
    ),
    exemplo: <>“Atender com o padrão da casa”: às 19h libera, você marca “Bom” e confirma.</>,
  },
  extraEquipe: {
    dica: <p>Fez algo que não estava na lista? Conte aqui (com foto, se quiser). Quem cuida da equipe aprova e isso aparece no seu mês.</p>,
    exemplo: <>“Consertei a cadeira 3 que estava bamba.”</>,
  },
  hojeEquipe: {
    dica: <p>Quanto do seu dia já está feito. Tarefas com peso maior (2× ou 3×) valem mais. Dê o check até o horário de fechamento.</p>,
    exemplo: <>Você tem 6 tarefas comuns e 1 de 3× (9 pontos). Fez as 6: 6 de 9 = 67%. Confirmou a de 3×: 100%.</>,
  },

  /* ------------------------------- painel ------------------------------- */
  reprovar: {
    dica: <p>Se a tarefa foi marcada mas não foi bem feita, reprove com um motivo. Ela deixa de contar no percentual e o colaborador recebe o aviso. Hoje, ele ainda pode refazer antes do fechamento.</p>,
    exemplo: <>“A foto mostra a bancada ainda com cabelo. Refaz, por favor.”</>,
  },
  extras: {
    dica: <p>Coisas que a equipe fez além da lista. Aprovar mostra reconhecimento e fica no relatório do mês. Não mudam o percentual.</p>,
    exemplo: <>“Organizei o estoque do depósito” com foto: aprove.</>,
  },
  fecharMes: {
    dica: <p>Disponível depois que o mês termina. Grava o percentual final, as extras aprovadas e o bônus de cada um. Depois de fechar, nada daquele mês pode ser alterado.</p>,
    exemplo: <>No dia 1º de dezembro, feche novembro e pague os bônus.</>,
  },
} satisfies Record<string, DicaTexto>
