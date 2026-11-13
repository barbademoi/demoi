import { Logo } from '@/components/tarefix/Logo'
import { Termometro } from '@/components/tarefix/Termometro'
import { AssimSim, Cuidado, Dicao, Exemplo, Indice, Passo, Passos, Pergunta, Secao } from '@/components/tarefix/guia'
import { BotaoVoltar } from './BotaoVoltar'

export const metadata = { title: 'Como usar (equipe)' }

const SECOES = [
  { id: 'primeira-vez', titulo: 'Primeira vez' },
  { id: 'check', titulo: 'Dar o check' },
  { id: 'foto', titulo: 'Tarefas com foto' },
  { id: 'dia-todo', titulo: 'Tarefas do dia todo' },
  { id: 'horarios', titulo: 'Horários, atraso e fechamento' },
  { id: 'observacao', titulo: 'Observações e tarefas extras' },
  { id: 'reprovada', titulo: 'Tarefa reprovada' },
  { id: 'percentual', titulo: 'Seu percentual e o bônus' },
  { id: 'notificacoes', titulo: 'Notificações' },
  { id: 'duvidas', titulo: 'Dúvidas' },
]

export default function AjudaEquipe() {
  let n = 0
  const num = () => ++n
  return (
    <main className="mx-auto max-w-2xl space-y-10 px-4 pb-16 pt-6">
      <div className="flex items-center justify-between">
        <Logo className="text-3xl" />
        <BotaoVoltar />
      </div>
      <header>
        <h1 className="text-3xl font-black tracking-tight">Como usar o Tarefix</h1>
        <p className="mt-1 text-tf-suave">Guia da equipe: o que fazer no seu celular, passo a passo, com exemplos.</p>
      </header>

      <Indice itens={SECOES} />

      <Secao id="primeira-vez" numero={num()} titulo="Primeira vez" resumo="Leva 1 minuto e só precisa fazer uma vez.">
        <Passos>
          <Passo titulo="Abra o seu link">
            <p>Quem cuida da equipe te mandou um link pelo WhatsApp. Ele é só seu: não repasse para ninguém.</p>
          </Passo>
          <Passo titulo="Digite o seu PIN">
            <p>São 4 números que te passaram pessoalmente. Depois disso o celular lembra de você.</p>
            <p className="text-sm text-tf-suave">Errou 5 vezes? Espere 5 minutos ou peça um PIN novo.</p>
          </Passo>
          <Passo titulo="Coloque na tela inicial">
            <p>Assim o Tarefix abre como um app, com um toque, e pode te mandar avisos.</p>
            <p className="text-sm text-tf-suave">
              <b>iPhone:</b> abra no Safari → botão Compartilhar (quadrado com seta) → “Adicionar à Tela de Início”.
              <br />
              <b>Android:</b> no Chrome, menu ⋮ → “Adicionar à tela inicial” ou “Instalar app”.
            </p>
          </Passo>
          <Passo titulo="Ative as notificações">
            <p>Toque em “Ativar notificações” e permita. Você vai receber um aviso na hora de começar cada tarefa.</p>
          </Passo>
        </Passos>
      </Secao>

      <Secao id="check" numero={num()} titulo="Dar o check" resumo="Fez? Marca na hora. Não deixa para o fim do dia.">
        <Passos>
          <Passo titulo="Faça a tarefa">
            <p>Toque no título para ver a descrição: muitas vezes ali está o jeito certo de fazer.</p>
          </Passo>
          <Passo titulo="Toque no quadradinho">
            <p>A tarefa fica marcada com o horário e o termômetro do dia sobe na hora.</p>
          </Passo>
          <Passo titulo="Marcou sem querer?">
            <p>Toque de novo para desmarcar. Se tinha foto, ela é apagada.</p>
          </Passo>
        </Passos>
        <Exemplo>
          <p>
            08:50 chega o aviso “Abrir a loja”. Você abre, liga as luzes e o som e marca às 08:56. Quem cuida da equipe vê: <b>Abrir a loja · 08:56</b>.
          </p>
        </Exemplo>
      </Secao>

      <Secao id="foto" numero={num()} titulo="Tarefas com foto" resumo="As que têm o ícone de câmera só concluem com foto.">
        <Passos>
          <Passo titulo="Toque para marcar">A câmera abre sozinha.</Passo>
          <Passo titulo="Tire a foto mostrando o resultado">
            <AssimSim
              linhas={[
                ['Foto do teto, escura, tremida', 'A bancada inteira, com luz, de frente'],
                ['Foto de longe do salão', 'De perto, mostrando o que foi limpo'],
              ]}
            />
          </Passo>
          <Passo titulo="Espere enviar">Sem internet? Aparece um aviso: confira o Wi-Fi e tente de novo.</Passo>
        </Passos>
      </Secao>

      <Secao id="dia-todo" numero={num()} titulo="Tarefas do dia todo" resumo="Ficam fixas no topo, com outra cor, e valem mais.">
        <p>São coisas que você faz o expediente inteiro, sem um momento certo de marcar.</p>
        <Passos>
          <Passo titulo="Faça o dia todo">Ex.: “Atender com o padrão da casa: café, toalha quente e oferecer o próximo horário”.</Passo>
          <Passo titulo="Perto do fechamento, o botão libera">Antes disso aparece um cadeado: não adianta confirmar de manhã.</Passo>
          <Passo titulo="Diga com sinceridade como foi">
            <p>Escolha Difícil, Fraco, Ok, Bom ou Excelente e confirme. A sua avaliação não muda o percentual: serve para conversar com quem cuida da equipe.</p>
          </Passo>
        </Passos>
        <Dicao>
          <p>Essas tarefas costumam valer 2× ou 3×. Esquecer de confirmar uma delas derruba bastante o seu dia.</p>
        </Dicao>
      </Secao>

      <Secao id="horarios" numero={num()} titulo="Horários, atraso e fechamento" resumo="O combinado é dar todos os checks até o horário de fechamento.">
        <Passos>
          <Passo titulo="Começar às">É o horário em que a tarefa deve começar. O aviso chega nessa hora.</Passo>
          <Passo titulo="Fazer até">
            <p>Passou desse horário sem marcar? A tarefa fica <b>atrasada</b>. Ainda dá para marcar e ela continua contando, mas aparece o atraso.</p>
          </Passo>
          <Passo titulo="Fechamento">
            <p>
              Depois do horário de fechamento ainda dá para marcar até a meia-noite, mas fica registrado como <b>fora do horário</b> e quem cuida da equipe vê. À meia-noite o dia fecha: o que ficou sem check
              conta como não feito.
            </p>
          </Passo>
        </Passos>
        <Cuidado>
          <p>Não deixe para marcar tudo no fim do dia. O horário de cada check aparece para quem cuida da equipe.</p>
        </Cuidado>
      </Secao>

      <Secao id="observacao" numero={num()} titulo="Observações e tarefas extras" resumo="Avise o que aconteceu e mostre o que você fez a mais.">
        <Passos>
          <Passo titulo="Observação numa tarefa">
            <p>Toque no balãozinho ao lado da tarefa e escreva. Use para avisar problemas.</p>
            <Exemplo>
              <p>“Faltou produto de limpeza.” · “A torneira do lavabo está pingando.” · “Cliente das 15h desmarcou, adiantei a limpeza.”</p>
            </Exemplo>
          </Passo>
          <Passo titulo="Tarefa extra">
            <p>Fez algo que não estava na lista? Toque em <b>+ Registrar tarefa extra</b> (no fim da lista), conte o que fez (foto opcional). Quem cuida da equipe aprova e fica no seu mês.</p>
            <Exemplo>
              <p>“Consertei a cadeira 3 que estava bamba.” · “Organizei o estoque do depósito.”</p>
            </Exemplo>
          </Passo>
        </Passos>
      </Secao>

      <Secao id="reprovada" numero={num()} titulo="Tarefa reprovada" resumo="Acontece. O importante é corrigir.">
        <p>
          Se a tarefa foi marcada mas não ficou boa, quem cuida da equipe pode reprovar com um motivo. Você recebe um aviso, a tarefa aparece como <b>Não aprovada</b> e sai do percentual.
        </p>
        <Exemplo>
          <p>“Reprovada: Bancada limpa. Motivo: a foto mostra cabelo no canto.” Se for hoje, refaça, tire uma foto nova e marque de novo antes do fechamento.</p>
        </Exemplo>
      </Secao>

      <Secao id="percentual" numero={num()} titulo="Seu percentual e o bônus" resumo="Cada tarefa vale pontos; tarefas importantes valem mais.">
        <div className="tf-cartao space-y-6 p-5">
          <Termometro rotulo="Faltou só a de 3×" percentual={67} detalhe="6 de 9 pontos" />
          <Termometro rotulo="Hoje: tudo feito" percentual={100} detalhe="9 de 9 pontos" />
          <Termometro rotulo="No mês, dia 10" percentual={37} detalhe="prévia" />
        </div>
        <p>
          <b>Hoje</b> = pontos feitos ÷ pontos do dia. <b>No mês</b> = tudo o que você fez ÷ todas as tarefas do mês, inclusive as dos dias que ainda vão chegar. Por isso o mês começa baixo e vai enchendo: no
          dia 10, quem está fazendo tudo certo está perto de 35–40%.
        </p>
        <p>
          Toque em <b>Meu mês</b> para ver o calendário (cada dia com a cor do seu percentual) e, se tiver bônus, os níveis e quanto falta para o próximo.
        </p>
        <Exemplo>
          <p>Bônus da casa: 90% → R$ 50 · 100% → R$ 100. Você está em 92% no fim do mês: ganha R$ 50. O valor é confirmado quando o mês é fechado.</p>
        </Exemplo>
        <Dicao>
          <p>Dia de folga não conta. Use as setas ‹ › ao lado da data para ver como foram os seus dias anteriores.</p>
        </Dicao>
      </Secao>

      <Secao id="notificacoes" numero={num()} titulo="Notificações" resumo="O celular te lembra, mesmo com o app fechado.">
        <ul className="tf-cartao divide-y divide-tf-borda">
          {[
            ['Na hora de começar cada tarefa', '08:50 “Hora de: Abrir a loja”'],
            ['30 min antes do fechamento, se faltar algo', '“Faltam 2 tarefas e o dia fecha às 20:30”'],
            ['Quando uma tarefa for reprovada', '“Reprovada: Bancada limpa”'],
          ].map(([t, e]) => (
            <li key={t} className="px-5 py-3">
              <p className="font-bold">{t}</p>
              <p className="text-sm text-tf-suave">{e}</p>
            </li>
          ))}
        </ul>
        <p className="text-sm text-tf-suave">No iPhone, os avisos só funcionam com o Tarefix na tela inicial (iOS 16.4 ou mais novo).</p>
      </Secao>

      <Secao id="duvidas" numero={num()} titulo="Dúvidas">
        <div className="tf-cartao">
          <Pergunta q="Esqueci o PIN.">
            <p>Peça para quem cuida da equipe trocar. Ele cria um novo e te passa.</p>
          </Pergunta>
          <Pergunta q="Troquei de celular.">
            <p>Abra o mesmo link no celular novo e digite o PIN. Está tudo lá.</p>
          </Pergunta>
          <Pergunta q="Uma tarefa não apareceu hoje.">
            <p>Toque em atualizar ↻ no topo. Se ainda não aparecer, avise quem cuida da equipe: pode ser que ela não esteja marcada para hoje.</p>
          </Pergunta>
          <Pergunta q="Estou sem internet.">
            <p>O check precisa de internet para ser salvo. Conecte no Wi-Fi da loja e marque de novo.</p>
          </Pergunta>
          <Pergunta q="Esqueci de marcar ontem.">
            <p>Se ainda não passou da meia-noite, dá para marcar (fica como fora do horário). Depois disso o dia fechou.</p>
          </Pergunta>
        </div>
      </Secao>
    </main>
  )
}
