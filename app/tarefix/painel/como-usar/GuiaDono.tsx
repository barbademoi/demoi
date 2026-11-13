import Link from 'next/link'
import { Termometro } from '@/components/tarefix/Termometro'
import { Dica } from '@/components/tarefix/Dica'
import { DICAS } from '@/components/tarefix/dicas'
import { AssimSim, Cuidado, Dicao, Exemplo, Indice, Passo, Passos, Pergunta, Secao, Tabela } from '@/components/tarefix/guia'
import { CompartilharGuia } from './CompartilharGuia'

export type ItemProgresso = { feito: boolean; titulo: string; href: string }

/** Conteúdo do guia "Como usar" do dono (a página só busca os dados). */
export function GuiaDono({ progresso, fecha, admin }: { progresso: ItemProgresso[]; fecha: string; admin: boolean }) {
  const prontos = progresso.filter((p) => p.feito).length

  const secoes = [
    { id: 'como-funciona', titulo: 'Como o Tarefix funciona' },
    { id: 'ajustes', titulo: 'Ajustes da empresa' },
    { id: 'funcoes', titulo: 'Funções' },
    { id: 'equipe', titulo: 'Cadastrar a equipe e mandar o link' },
    { id: 'tarefas', titulo: 'Montar as tarefas' },
    { id: 'percentual', titulo: 'Como o percentual é calculado' },
    { id: 'dia-a-dia', titulo: 'Acompanhar o dia' },
    { id: 'mes', titulo: 'O mês, o bônus e o fechamento' },
    { id: 'notificacoes', titulo: 'Notificações no celular' },
    { id: 'equipe-ve', titulo: 'O que a equipe vê' },
    ...(admin ? [{ id: 'mentorados', titulo: 'Mentorados' }] : []),
    { id: 'rotina', titulo: 'Rotina que funciona' },
    { id: 'duvidas', titulo: 'Dúvidas e problemas' },
  ]
  let n = 0
  const num = () => ++n

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-black tracking-tight">Como usar o Tarefix</h1>
        <p className="mt-1 text-tf-suave">
          Do zero até a equipe dando check todo dia, com exemplos reais de barbearia. Viu um <span className="mx-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px] font-black">?</span> no
          app? Passe o mouse (ou toque) para ver a explicação daquele campo.
        </p>
      </header>

      {/* ------------------------------ progresso ------------------------------ */}
      <section className="tf-cartao p-5">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-extrabold">Seu progresso</h2>
          <span className="text-sm font-bold text-tf-suave">
            {prontos} de {progresso.length}
          </span>
        </div>
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-tf-borda">
          <div className="h-full rounded-full bg-tf-marca transition-all" style={{ width: `${(prontos / progresso.length) * 100}%` }} />
        </div>
        <ul className="grid gap-1 sm:grid-cols-2">
          {progresso.map((p) => (
            <li key={p.titulo}>
              <Link href={p.href} className="flex min-h-[44px] items-center gap-3 rounded-xl px-2 hover:bg-tf-marca-clara/60">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                    p.feito ? 'bg-tf-marca text-white' : 'border-2 border-tf-borda text-transparent'
                  }`}
                >
                  ✓
                </span>
                <span className={p.feito ? 'text-tf-suave line-through' : 'font-bold'}>{p.titulo}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Indice itens={secoes} />

      {/* --------------------------- 1. como funciona --------------------------- */}
      <Secao id="como-funciona" numero={num()} titulo="Como o Tarefix funciona" resumo="Em um minuto: você monta uma vez, a equipe marca todo dia, você acompanha.">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['1. Você monta', 'Cadastra cada pessoa e as tarefas dela por dia da semana. Faz isso uma vez; as tarefas se repetem sozinhas.'],
            ['2. A equipe marca', 'Cada um abre o próprio link no celular, digita o PIN uma vez e dá o check em cada tarefa (com foto quando você pedir).'],
            ['3. Você acompanha', 'No painel Hoje você vê em tempo real quem fez o quê, a que horas, as fotos, o que atrasou, e pode reprovar.'],
            ['4. O mês fecha', 'Cada dia vira um percentual. No fim do mês você fecha, vê o resultado de cada um e paga o bônus de quem bateu a meta.'],
          ].map(([t, d]) => (
            <div key={t} className="tf-cartao p-4">
              <p className="font-extrabold">{t}</p>
              <p className="mt-1 text-sm text-tf-suave">{d}</p>
            </div>
          ))}
        </div>
        <Exemplo>
          <p>
            <b>Barbearia com 3 pessoas:</b> Lucas e Rafa (barbeiros) e Ana (recepção). Cada um recebe um link. Às 8h50 o celular do Lucas avisa “Abrir a loja”; ele abre, tira a foto da fachada e marca.
            Você, de casa, vê o check às 8h52 com a foto. Às {fecha} o dia fecha e chega no seu celular o resumo: “Equipe 92% hoje”.
          </p>
        </Exemplo>
      </Secao>

      {/* ------------------------------ 2. ajustes ------------------------------ */}
      <Secao id="ajustes" numero={num()} titulo="Ajustes da empresa" resumo="5 minutos. Define as regras do dia para todo mundo.">
        <Passos>
          <Passo titulo="Confira o horário de fechamento" href="/tarefix/painel/configuracoes" botao="Abrir Ajustes">
            <p>
              É até quando a equipe deve dar os checks. Hoje está em <b>{fecha}</b>. Depois desse horário ainda dá para marcar até a meia-noite, mas a tarefa fica registrada como “fora do horário” (você vê). À
              meia-noite o dia fecha de vez.
            </p>
            <Exemplo titulo="Como escolher">
              <p>Fecha a porta às 20h e leva 20 min para limpar e fechar o caixa? Coloque <b>20:30</b>. Se colocar 20:00, as tarefas de fechamento vão sempre cair “fora do horário”.</p>
            </Exemplo>
          </Passo>
          <Passo titulo="Defina quando liberar as tarefas “do dia todo”">
            <p>São as tarefas sem check rápido (ex.: “atender com o padrão da casa”). O colaborador só consegue confirmar um tempo antes do fechamento. Padrão: 60 min.</p>
            <p className="text-sm text-tf-suave">Fechamento {fecha} com 60 min → libera 1 hora antes.</p>
          </Passo>
          <Passo titulo="Escolha o tom das mensagens">
            <p>
              <b>Zoeira</b> (“Dia 100%. Pode sair andando em câmera lenta.”) ou <b>Neutro</b> (“Dia 100%. Ótimo trabalho!”). Equipe jovem costuma curtir o zoeira; recepção de clínica, o neutro.
            </p>
          </Passo>
          <Passo titulo="Coloque o logo">Aparece na tela de cada colaborador. Uma imagem quadrada fica melhor.</Passo>
        </Passos>
      </Secao>

      {/* ------------------------------ 3. funções ------------------------------ */}
      <Secao id="funcoes" numero={num()} titulo="Funções" resumo="Os cargos da equipe. Rápido e opcional, mas organiza o painel.">
        <Passos>
          <Passo titulo="Crie uma função para cada tipo de trabalho" href="/tarefix/painel/funcoes" botao="Abrir Funções">
            <p>Ela aparece ao lado do nome no painel, então você bate o olho e sabe quem é quem.</p>
            <Exemplo>
              <p>Barbeiro · Recepção · Auxiliar de limpeza · Gerente</p>
            </Exemplo>
          </Passo>
        </Passos>
        <Dicao>
          <p>Não precisa criar uma função por pessoa. Dois barbeiros = uma função “Barbeiro”. A diferença entre eles fica nas tarefas.</p>
        </Dicao>
      </Secao>

      {/* ------------------------------ 4. equipe ------------------------------ */}
      <Secao id="equipe" numero={num()} titulo="Cadastrar a equipe e mandar o link" resumo="Cada pessoa tem um link só dela, protegido por um PIN.">
        <Passos>
          <Passo titulo="Cadastre a pessoa" href="/tarefix/painel/colaboradores" botao="Abrir Equipe">
            <p>
              Toque em <b>+ Novo</b>, preencha o nome, a função e crie um <b>PIN de 4 números</b>. Anote o PIN: ele não aparece de novo (se esquecer, é só trocar).
            </p>
            <Exemplo>
              <p>Nome: <b>Lucas Almeida</b> · Função: <b>Barbeiro</b> · PIN: <b>4827</b></p>
            </Exemplo>
          </Passo>
          <Passo titulo="Mande o link pelo WhatsApp">
            <p>
              Na página da pessoa, toque em <b>Enviar no WhatsApp</b>. A mensagem já vai pronta com o link e a dica de colocar na tela inicial.
            </p>
          </Passo>
          <Passo titulo="Passe o PIN pessoalmente">
            <p>O PIN nunca vai junto com o link. Assim, se o link for parar no grupo errado, ninguém entra no lugar do Lucas.</p>
          </Passo>
          <Passo titulo="Peça para colocar o Tarefix na tela inicial do celular">
            <p>Vira um “app”: abre com um toque e permite receber notificações (no iPhone, as notificações só funcionam assim).</p>
            <p className="text-sm text-tf-suave">
              iPhone: abrir no Safari → botão Compartilhar → “Adicionar à Tela de Início”. Android: no Chrome, menu ⋮ → “Adicionar à tela inicial” (ou “Instalar app”).
            </p>
          </Passo>
          <Passo titulo="Marque as folgas">
            <p>Na página da pessoa, em <b>Folgas</b>, toque nos dias. Nesses dias não aparecem tarefas e o dia não pesa contra o mês dela.</p>
            <Exemplo>
              <p>Ana folga toda segunda e tira férias de 10 a 20: marque essas datas. O mês dela é calculado só com os dias trabalhados.</p>
            </Exemplo>
          </Passo>
        </Passos>
        <Cuidado>
          <p>
            Alguém saiu da equipe ou perdeu o celular? Na página da pessoa use <b>Gerar novo link</b> (o antigo para na hora) ou desligue <b>Colaborador ativo</b>, no fim da página. Os dados antigos ficam guardados.
          </p>
        </Cuidado>
      </Secao>

      {/* ------------------------------ 5. tarefas ------------------------------ */}
      <Secao id="tarefas" numero={num()} titulo="Montar as tarefas" resumo="A parte mais importante. Tarefa bem escrita = equipe que entende e cumpre.">
        <p>
          Abra <Link href="/tarefix/painel/tarefas" className="font-bold text-tf-marca-texto underline">Tarefas</Link>, escolha a pessoa no topo e crie. Existem dois tipos:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="tf-cartao p-4">
            <p className="flex items-center gap-2 font-extrabold">Recorrente <Dica titulo="Recorrentes" {...DICAS.recorrentes} /></p>
            <p className="mt-1 text-sm text-tf-suave">Repete toda semana nos dias marcados. É 90% do uso.</p>
            <p className="mt-2 text-sm">Ex.: “Limpar as máquinas”, Seg a Sáb.</p>
          </div>
          <div className="tf-cartao p-4">
            <p className="flex items-center gap-2 font-extrabold">Avulsa <Dica titulo="Avulsas" {...DICAS.avulsas} /></p>
            <p className="mt-1 text-sm text-tf-suave">Aparece só numa data. Para imprevistos e tarefas pontuais.</p>
            <p className="mt-2 text-sm">Ex.: “Receber o fornecedor”, quinta dia 20.</p>
          </div>
        </div>

        <h3 className="pt-2 text-lg font-extrabold">Cada campo, com exemplo</h3>
        <Tabela
          cabecalho={['Campo', 'Para que serve', 'Exemplo']}
          linhas={[
            ['Título', 'O que fazer, começando com verbo.', '“Limpar e desinfetar as máquinas”'],
            ['Descrição', 'O padrão esperado / passo a passo.', '“Tirar os pentes, escovar, borrifar e guardar na gaveta 2.”'],
            ['Dias da semana', 'Em que dias a tarefa aparece.', 'Seg a Sáb'],
            ['Vale o dia todo', 'Para o que dura o expediente inteiro. Fica fixa no topo e só confirma perto do fechamento.', '“Atender com o padrão da casa”'],
            ['Peso', 'Quanto vale no percentual (1×, 2× ou 3×).', 'Atendimento 3×; repor papel toalha 1×'],
            ['Começar às', 'Ordena o dia e dispara o aviso no celular.', '19:30'],
            ['Tempo estimado', 'Duração; calcula o fim previsto.', '15 min → fim 19:45'],
            ['Fazer até', 'Hora limite; depois aparece “atrasada”.', '09:15'],
            ['Exige foto', 'Só conclui com foto tirada na hora.', 'Bancada limpa no fechamento'],
          ]}
        />

        <Exemplo titulo="Exemplo completo: o dia do Lucas (barbeiro)">
          <Tabela
            cabecalho={['Tarefa', 'Dias', 'Começar · tempo', 'Fazer até', 'Peso', 'Foto']}
            linhas={[
              ['Abrir a loja, luzes e som', 'Seg–Sáb', '08:50 · 10 min', '09:00', '1×', 'Sim (fachada)'],
              ['Conferir a agenda do dia e confirmar os clientes', 'Seg–Sáb', '09:00 · 15 min', '09:15', '1×', '—'],
              ['Atender com o padrão da casa (café, toalha quente, oferecer o próximo horário)', 'Seg–Sáb', 'o dia todo', '—', '3×', '—'],
              ['Postar 2 stories de cortes do dia', 'Seg–Sáb', '12:00 · 10 min', '14:00', '1×', '—'],
              ['Lavar as toalhas', 'Ter e Sex', '15:00 · 20 min', '—', '1×', '—'],
              ['Limpar e desinfetar as máquinas', 'Seg–Sáb', '19:30 · 15 min', '—', '2×', 'Sim'],
              ['Bancada e chão limpos', 'Seg–Sáb', '19:45 · 15 min', '20:15', '1×', 'Sim'],
            ]}
          />
          <p className="text-sm">
            Resultado: numa terça, o Lucas tem 7 tarefas que valem <b>10 pontos</b> (a do dia todo vale 3, as máquinas valem 2; nas segundas, sem as toalhas, são 6 tarefas e 9 pontos). Ele recebe o aviso de cada uma na hora certa e você vê as fotos da abertura e do fechamento.
          </p>
        </Exemplo>

        <h3 className="pt-2 text-lg font-extrabold">Escrevendo tarefas que funcionam</h3>
        <AssimSim
          linhas={[
            ['Banheiro', 'Limpar o banheiro: vaso, pia, espelho e repor papel'],
            ['Redes sociais', 'Postar 2 stories de cortes do dia'],
            ['Caixa', 'Fechar o caixa e mandar o print do relatório no grupo'],
            ['Ser simpático', 'Oferecer café e o próximo horário a cada cliente (dia todo, 3×)'],
            ['Estoque (todo dia)', 'Contar as pomadas e anotar o que falta (só na segunda)'],
          ]}
        />
        <Dicao>
          <p>
            <b>Comece pequeno:</b> 5 a 8 tarefas por pessoa na primeira semana. Depois de 7 dias olhe o Histórico: o que ninguém consegue fazer no horário precisa mudar de horário, e o que todo mundo faz
            sem pensar pode até sair da lista.
          </p>
        </Dicao>
        <Dicao>
          <p>
            Arraste pelos pontinhos <b>⋮⋮</b> para mudar a ordem. É nessa ordem que a lista aparece no celular da equipe: coloque na sequência real do dia.
          </p>
        </Dicao>
        <Cuidado>
          <p>
            Mudanças valem a partir de agora. Criou uma recorrente hoje e o dia de hoje está marcado? Ela já aparece hoje. Os dias que já passaram não mudam. Para tirar uma tarefa por uns tempos, use <b>Ativa</b> (pausar) em vez de apagar.
          </p>
        </Cuidado>
      </Secao>

      {/* ---------------------------- 6. percentual ---------------------------- */}
      <Secao id="percentual" numero={num()} titulo="Como o percentual é calculado" resumo="Entender isso evita discussão com a equipe.">
        <p>
          Cada tarefa vale pontos (o peso: 1, 2 ou 3). O percentual do dia é <b>pontos feitos ÷ pontos do dia</b>. Veja a terça do Lucas (7 tarefas, 10 pontos) em três situações:
        </p>
        <div className="tf-cartao space-y-6 p-5">
          <div>
            <Termometro rotulo="Fez tudo, menos o atendimento (3×)" percentual={70} detalhe="7 de 10 pontos" />
            <p className="mt-1 text-sm text-tf-suave">6 de 7 tarefas parece 86%, mas a que ficou de fora vale 3. Por isso dá 70%.</p>
          </div>
          <div>
            <Termometro rotulo="Esqueceu só as stories (1×)" percentual={90} detalhe="9 de 10 pontos" />
          </div>
          <div>
            <Termometro rotulo="Tudo feito" percentual={100} detalhe="10 de 10 pontos" />
          </div>
        </div>
        <Tabela
          cabecalho={['Situação', 'Conta no percentual?']}
          linhas={[
            ['Marcou no horário', 'Sim'],
            ['Marcou atrasada (depois do “fazer até”)', 'Sim, mas aparece como atrasada para você'],
            ['Marcou depois do fechamento, antes da meia-noite', 'Sim, mas fica registrada como “fora do horário”'],
            ['Não marcou até a meia-noite', 'Não: conta como não feita'],
            ['Você reprovou', 'Não. Se for hoje, ainda dá para refazer antes do fechamento'],
            ['Dia de folga', 'O dia nem entra na conta'],
            ['Tarefa extra aprovada', 'Não muda o %, mas aparece no mês como reconhecimento'],
            ['Autoavaliação (Difícil a Excelente)', 'Não muda o %; serve para conversa'],
          ]}
        />
      </Secao>

      {/* ----------------------------- 7. dia a dia ----------------------------- */}
      <Secao id="dia-a-dia" numero={num()} titulo="Acompanhar o dia" resumo="5 minutos por dia bastam.">
        <Passos>
          <Passo titulo="Abra o painel Hoje" href="/tarefix/painel" botao="Abrir Hoje">
            <p>
              No topo, o termômetro da equipe. Abaixo, um cartão por pessoa: quantas pendentes, quantas atrasadas, as fotos e cada check com o horário. A tela atualiza sozinha a cada minuto (ou toque no botão
              de atualizar ↻).
            </p>
          </Passo>
          <Passo titulo="Confira as fotos e reprove se precisar">
            <p>Toque na tarefa → <b>Reprovar</b> → escreva o motivo. A pessoa recebe o aviso no celular e a tarefa sai do percentual.</p>
            <AssimSim
              linhas={[
                ['Tá errado isso aí', 'A foto mostra a bancada com cabelo no canto. Refaz, por favor.'],
                ['Não fez direito', 'Faltou repor o papel toalha do lavabo.'],
              ]}
            />
          </Passo>
          <Passo titulo="Aprove as extras">
            <p>Quando alguém faz algo fora da lista (“Consertei a cadeira 3”), aparece em <b>Extras para aprovar</b>. Aprovar é um “valeu” oficial que fica no mês da pessoa.</p>
          </Passo>
          <Passo titulo="Veja dias anteriores">
            <p>Use as setas ‹ › ao lado da data para voltar até 60 dias. Dá para reprovar enquanto o mês não for fechado. O <b>Histórico</b> mostra um dia de uma pessoa em detalhe.</p>
          </Passo>
          <Passo titulo="Sininho de avisos">
            <p>O sininho junta o que aconteceu: resumo do fechamento, fotos e extras novas. O número vermelho mostra o que você ainda não viu.</p>
          </Passo>
        </Passos>
        <Dicao>
          <p>
            Faça uma rodada rápida todo dia no mesmo horário (ex.: às 21h, depois do fechamento). Reprovar no mesmo dia ensina muito mais do que reclamar uma semana depois.
          </p>
        </Dicao>
      </Secao>

      {/* -------------------------------- 8. mês -------------------------------- */}
      <Secao id="mes" numero={num()} titulo="O mês, o bônus e o fechamento" resumo="O termômetro do mês é uma prévia que vai enchendo até o último dia.">
        <p>
          Em <Link href="/tarefix/painel/mes" className="font-bold text-tf-marca-texto underline">Mês</Link>, cada pessoa tem um termômetro: pontos feitos ÷ pontos de <b>todas</b> as tarefas do mês (inclusive as dos
          dias que ainda vão chegar).
        </p>
        <div className="tf-cartao space-y-6 p-5">
          <Termometro rotulo="Dia 10 (prévia)" percentual={37} detalhe="95 de 260 pontos" {...DICAS.termoMes} />
          <Termometro rotulo="Dia 30, quase tudo feito" percentual={94} detalhe="244 de 260 pontos" />
        </div>
        <Exemplo>
          <p>
            O Lucas tem uns 10 pontos por dia e trabalha 26 dias: cerca de 260 pontos no mês. No dia 10 ele fez 95 → <b>37%</b>, com “Faltam 165 tarefas em 16 dias”. Não é que ele esteja mal: é que o mês ainda não acabou.
            Se fizer tudo até o fim, fecha em 100%.
          </p>
        </Exemplo>
        <Passos>
          <Passo titulo="Configure o bônus (opcional)" href="/tarefix/painel/configuracoes" botao="Abrir Ajustes">
            <p>Ligue “Bônus ativo” e crie até 5 níveis. Vale o maior nível alcançado no mês.</p>
            <Exemplo>
              <p>90% → R$ 50 · 95% → R$ 80 · 100% → R$ 150 + sábado de folga</p>
            </Exemplo>
            <p className="text-sm text-tf-suave">Com “Mostrar para o colaborador” ligado, ele vê os níveis e quanto falta (“faltam 4% para R$ 80”). Motiva muito mais.</p>
          </Passo>
          <Passo titulo="Feche o mês quando ele terminar">
            <p>
              A partir do dia 1º, abra o mês anterior e toque em <b>Fechar mês</b>. Antes, decida as extras pendentes e confira as reprovações: depois de fechado, nada daquele mês muda. Aí é só pagar o bônus
              mostrado em cada pessoa.
            </p>
          </Passo>
        </Passos>
      </Secao>

      {/* ---------------------------- 9. notificações ---------------------------- */}
      <Secao id="notificacoes" numero={num()} titulo="Notificações no celular" resumo="Avisos que chegam mesmo com o app fechado.">
        <Tabela
          cabecalho={['Aviso', 'Para quem', 'Exemplo']}
          linhas={[
            ['Na hora de começar cada tarefa', 'Equipe', '08:50 “Hora de: Abrir a loja”'],
            ['30 min antes do fechamento, com pendentes', 'Equipe', '“Faltam 2 tarefas e o dia fecha às 20:30”'],
            ['Tarefa reprovada', 'Equipe', '“Reprovada: Bancada limpa. Motivo: cabelo no canto.”'],
            ['Cada tarefa concluída', 'Você', '“Lucas concluiu: Abrir a loja”'],
            ['Nova extra para aprovar', 'Você', '“Ana enviou uma extra: Organizei o estoque”'],
            ['Resumo do fechamento', 'Você', '“Equipe 92% hoje. Rafa ficou com 2 pendentes.”'],
          ]}
        />
        <Passos>
          <Passo titulo="Ligue no seu celular" href="/tarefix/painel/configuracoes" botao="Abrir Ajustes">
            <p>Em Ajustes → Notificações, toque em ativar e permita. Depois use <b>Enviar notificação de teste para mim</b> para conferir.</p>
          </Passo>
          <Passo titulo="Escolha o que quer receber">
            <p>Muitos checks por dia? Desligue “Cada tarefa concluída” e fique só com o resumo e as extras.</p>
          </Passo>
          <Passo titulo="A equipe liga no link dela">
            <p>Cada colaborador toca em “Ativar notificações” na própria tela. No iPhone, só depois de colocar o Tarefix na tela inicial.</p>
          </Passo>
        </Passos>
      </Secao>

      {/* ---------------------------- 10. equipe vê ---------------------------- */}
      <Secao id="equipe-ve" numero={num()} titulo="O que a equipe vê" resumo="Existe um guia só para a equipe, em linguagem simples.">
        <p>
          A tela do colaborador mostra: o termômetro do dia, as tarefas “do dia todo” fixas no topo, a lista com horários, o botão de foto, o campo de observação (“faltou produto de limpeza”), o botão de
          tarefa extra e o “Meu mês” com o bônus.
        </p>
        <div className="tf-cartao space-y-3 p-5">
          <p className="font-bold">Mande o guia da equipe para todo mundo:</p>
          <CompartilharGuia />
          <Link href="/tarefix/ajuda" className="inline-block text-sm font-bold text-tf-marca-texto underline">
            Ver o guia da equipe
          </Link>
        </div>
      </Secao>

      {/* ---------------------------- 11. mentorados ---------------------------- */}
      {admin && (
        <Secao id="mentorados" numero={num()} titulo="Mentorados" resumo="Só você vê esta parte.">
          <Passos>
            <Passo titulo="Conceda o acesso" href="/tarefix/painel/acessos" botao="Abrir Mentorados">
              <p>Preencha nome, e-mail e o nome da empresa do mentorado. Ele ganha um Tarefix só dele: equipe, tarefas e dados separados dos seus.</p>
            </Passo>
            <Passo titulo="Envie os dados de entrada">
              <p>E-mail novo: aparece uma senha provisória (só uma vez). Use <b>Enviar no WhatsApp</b>. Se o e-mail já tem conta no BarberMeta, ele entra com a senha de sempre.</p>
            </Passo>
            <Passo titulo="Suspenda se precisar">
              <p>Desligar “Acesso liberado” bloqueia o mentorado e a equipe dele. Os dados ficam guardados; religou, volta tudo.</p>
            </Passo>
          </Passos>
        </Secao>
      )}

      {/* ------------------------------ rotina ------------------------------ */}
      <Secao id="rotina" numero={num()} titulo="Rotina que funciona" resumo="O que separa quem usa o Tarefix por uma semana de quem usa por um ano.">
        <Tabela
          cabecalho={['Quando', 'O que fazer', 'Tempo']}
          linhas={[
            ['Todo dia, depois do fechamento', 'Olhar o painel Hoje, conferir as fotos, reprovar o que precisar, aprovar extras.', '5 min'],
            ['Toda segunda', 'Abrir o Mês: quem está abaixo de 80% na prévia? Conversar antes que vire problema.', '10 min'],
            ['Depois da 1ª semana', 'Ajustar horários que ninguém cumpre e tirar tarefas que não fazem sentido.', '15 min'],
            ['Dia 1º', 'Fechar o mês anterior, pagar os bônus e elogiar em público quem bateu 100%.', '10 min'],
          ]}
        />
        <Dicao>
          <p>
            Apresente o Tarefix como ferramenta da equipe, não como vigilância: “é a nossa lista, para ninguém precisar ficar lembrando ninguém, e quem caprichar ganha bônus”.
          </p>
        </Dicao>
      </Secao>

      {/* ------------------------------ dúvidas ------------------------------ */}
      <Secao id="duvidas" numero={num()} titulo="Dúvidas e problemas">
        <div className="tf-cartao">
          <Pergunta q="O colaborador esqueceu o PIN.">
            <p>Na página dele, toque em <b>Trocar PIN</b>, crie um novo e passe pessoalmente. Se ele errou 5 vezes, o link travou por 5 minutos; trocar o PIN destrava na hora.</p>
          </Pergunta>
          <Pergunta q="Ele trocou de celular.">
            <p>É só abrir o mesmo link no celular novo e digitar o PIN. Nada se perde.</p>
          </Pergunta>
          <Pergunta q="Alguém saiu da equipe.">
            <p>Na página da pessoa, desligue <b>Colaborador ativo</b> (no fim da página). O link para de funcionar e ela sai do painel, mas o histórico dela continua guardado.</p>
          </Pergunta>
          <Pergunta q="Criei uma tarefa e ela não apareceu.">
            <p>Confira: (1) o dia da semana de hoje está marcado? (2) a tarefa está “Ativa”? (3) hoje não é folga da pessoa? Se sim, peça para ela tocar em atualizar ↻.</p>
          </Pergunta>
          <Pergunta q="O percentual do mês está baixo, mas a pessoa está fazendo tudo.">
            <p>É a prévia: ela conta também os dias que ainda vão chegar. No dia 10, quem fez tudo certinho está por volta de 35–40%. Compare com “Faltam X tarefas em Y dias”.</p>
          </Pergunta>
          <Pergunta q="Esqueceram de marcar ontem. Dá para corrigir?">
            <p>Até a meia-noite, a própria pessoa ainda consegue (fica como “fora do horário”). Depois disso o dia fechou: é isso que mantém o combinado de dar o check no dia.</p>
          </Pergunta>
          <Pergunta q="As notificações não chegam.">
            <p>
              (1) A pessoa tocou em “Ativar notificações” e permitiu? (2) No iPhone, o Tarefix está na tela inicial? (3) O tipo de aviso está ligado em Ajustes? (4) O celular não está em “Não perturbe”? Use o
              botão de teste para conferir.
            </p>
          </Pergunta>
          <Pergunta q="O link do colaborador vazou.">
            <p>Sem o PIN ninguém entra. Mesmo assim, por segurança, toque em <b>Gerar novo link</b> e mande o novo só para ele.</p>
          </Pergunta>
        </div>
      </Secao>
    </div>
  )
}
