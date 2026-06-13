import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'

export const metadata = {
  title: 'Como usar — BarberMeta',
}

export default async function ComoUsarPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios').select('barbearias(nome)').eq('id', user.id).single() as
    { data: { barbearias: { nome: string } | null } | null }
  const barbeariaNome = usuario?.barbearias?.nome ?? ''

  return (
    <div className="min-h-screen flex">
      <Sidebar barbeariaNome={barbeariaNome} />
      <div className="flex-1 min-w-0 lg:pl-64 pt-14 lg:pt-0">
        <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">
          <header>
            <h1 className="font-serif text-2xl sm:text-3xl text-text">Como usar o BarberMeta</h1>
            <p className="text-text-muted text-sm font-sans mt-1">
              Guia simples, passo a passo. Se a dúvida persistir, fala com o suporte no WhatsApp na barra lateral.
            </p>
          </header>

          {/* Sumário */}
          <nav className="card p-5">
            <p className="text-text-muted text-xs font-sans uppercase tracking-wide mb-3">Vá direto pro assunto</p>
            <ul className="space-y-1.5">
              {SUMARIO.map(s => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-primary hover:underline text-sm font-sans">
                    {s.icon} {s.titulo}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Seção: O que é o BarberMeta */}
          <Secao id="o-que-e" icon="🎯" titulo="O que é o BarberMeta?">
            <Texto>
              É um sistema pra você medir o desempenho dos seus barbeiros e premiar quem produz mais —
              sem precisar cobrar ninguém. Cada barbeiro recebe um link único, abre no celular dele
              e vê em tempo real:
            </Texto>
            <Lista>
              <li>Quanto já faturou no mês</li>
              <li>Quanto falta pra cada meta (Bronze / Prata / Ouro)</li>
              <li>Em que posição está no ranking</li>
              <li>Os feedbacks dos clientes que ele atendeu</li>
            </Lista>
            <Dica>
              <strong>Sem app, sem senha, sem treinamento.</strong> O barbeiro só abre o link e usa.
              Tudo que você faz no dashboard aparece na tela dele na hora.
            </Dica>
          </Secao>

          {/* Seção: Primeira configuração */}
          <Secao id="primeira-config" icon="🛠️" titulo="Primeira configuração (faça uma vez)">
            <p className="font-semibold text-text mb-2">1. Cadastrar a equipe</p>
            <Passos>
              <li>Menu lateral → <Botao>Configurações</Botao> → aba <Botao>Equipe</Botao></li>
              <li>Clique em <Botao>+ Adicionar barbeiro</Botao></li>
              <li>Preencha o nome e o tipo (Barbeiro ou Recepcionista)</li>
              <li>Repita pra todo mundo</li>
            </Passos>

            <p className="font-semibold text-text mt-5 mb-2">2. Configurar metas do mês</p>
            <Passos>
              <li>No <Botao>Dashboard</Botao>, clique em <Botao>Metas & Pontos</Botao> (botão à esquerda)</li>
              <li>Defina os 3 tiers: <strong>Bronze</strong> (mais fácil) → <strong>Prata</strong> → <strong>Ouro</strong> (mais difícil)</li>
              <li>Em cada tier coloque o valor de comissão necessário pra atingir + o prêmio (R$, dia de folga, etc.)</li>
              <li>Defina também a <strong>meta coletiva</strong> da casa toda + prêmio</li>
              <li>Salvar</li>
            </Passos>
            <Dica>
              Comece com tiers <em>realistas</em>. Bronze tem que ser atingível por todos. Ouro só pra quem
              vai além. Se ninguém bate o tier mais baixo, a meta vira frustração.
            </Dica>

            <p className="font-semibold text-text mt-5 mb-2">3. (Opcional) Configurar campanha de pontos</p>
            <Texto>
              Use a campanha quando quer premiar serviços específicos (assinatura, hidratação, depilação)
              em vez de só comissão.
            </Texto>
            <Passos>
              <li>No dashboard, clique em <Botao>Configurar campanha</Botao></li>
              <li>Aba <Botao>Serviços</Botao>: adicione cada serviço e quantos pontos vale</li>
              <li>Aba <Botao>Premiação</Botao>: defina R$ pra 1º, 2º, 3º colocado</li>
              <li>Aba <Botao>Configurações</Botao>: mínimo de pontos pra entrar no ranking, bônus por X assinaturas, e <strong>quem lança</strong> (cada barbeiro ou só você)</li>
              <li>Aba <Botao>Regras</Botao>: ajuste o texto das regras gerais que aparecem pro barbeiro</li>
              <li>Salvar campanha</li>
            </Passos>
          </Secao>

          {/* Seção: Rotina diária */}
          <Secao id="rotina" icon="📅" titulo="Rotina do dia a dia (todo dia, ~5 min)">
            <p className="font-semibold text-text mb-2">Lançar comandas (atendimentos) do dia</p>
            <Passos>
              <li>Menu → <Botao>Lançamento diário</Botao></li>
              <li>Cada linha é um barbeiro. Digite quantas comandas (atendimentos) ele fez no dia</li>
              <li>Salvar</li>
            </Passos>
            <Dica>
              Se esquecer de lançar um dia, vai lá na data que faltou (botão de calendário) e lança depois. Não atrapalha.
            </Dica>

            <p className="font-semibold text-text mt-5 mb-2">Lançar pontos (se tiver campanha)</p>
            <Texto>
              Se a campanha tá no modo <em>&ldquo;Cada barbeiro lança a sua&rdquo;</em>, o barbeiro lança pelo
              link dele. Se for <em>&ldquo;Só o dono lança&rdquo;</em>:
            </Texto>
            <Passos>
              <li>Menu → <Botao>Lançamento de pontos</Botao></li>
              <li>Escolha o barbeiro</li>
              <li>Escolha a data</li>
              <li>Clique em <Botao>+ Adicionar lançamento</Botao>, escolha o serviço e a quantidade</li>
              <li>Salvar</li>
            </Passos>

            <p className="font-semibold text-text mt-5 mb-2">Atualizar comissão acumulada (quando precisar)</p>
            <Passos>
              <li>No <Botao>Dashboard</Botao>, ao lado de cada barbeiro, ajuste o valor da comissão acumulada do mês</li>
              <li>Salvar</li>
              <li>O ranking e a barra de progresso atualizam na hora pra todos</li>
            </Passos>
          </Secao>

          {/* Seção: Link do barbeiro */}
          <Secao id="link-barbeiro" icon="🔗" titulo="O link do barbeiro">
            <Texto>
              Cada barbeiro tem um link único tipo <code>www.barbermeta.com.br/b/abc1234</code>.
              Esse link é privado dele — não compartilha publicamente.
            </Texto>

            <p className="font-semibold text-text mt-4 mb-2">Como pegar o link de um barbeiro</p>
            <Passos>
              <li>Menu → <Botao>Configurações</Botao> → aba <Botao>Equipe</Botao></li>
              <li>Ao lado do nome do barbeiro tem o link dele. Copie</li>
              <li>Manda no WhatsApp privado do barbeiro</li>
            </Passos>

            <p className="font-semibold text-text mt-4 mb-2">O que o barbeiro vê no link dele</p>
            <Lista>
              <li><strong>Progresso</strong>: comissão acumulada, % das metas Bronze/Prata/Ouro, posição no ranking, mensagem motivadora do dia</li>
              <li><strong>Lançar dia</strong>: só aparece se a campanha tá em modo &ldquo;Cada barbeiro lança a sua&rdquo;</li>
              <li><strong>Regras</strong>: regras gerais da campanha</li>
              <li><strong>Feedbacks</strong>: feedbacks dos clientes que apontaram ele como atendente — junto com o brinde que cada cliente ganhou (pra ele oferecer no próximo atendimento)</li>
            </Lista>
            <Dica>
              No menu lateral em <Botao>Configurações</Botao> &gt; <Botao>Operação</Botao> tu controla
              o que cada barbeiro pode ver no link dele — mostrar/esconder ranking, faturamento da casa, ticket médio.
            </Dica>
          </Secao>

          {/* Seção: Feedback de Cliente */}
          <Secao id="feedback" icon="⭐" titulo="Feedback de Cliente (estratégia de retorno)">
            <Texto>
              Estratégia: cliente avalia → ganha um brinde sorteado → o barbeiro vê o brinde no link dele →
              oferece no próximo atendimento. <strong>O cliente volta.</strong>
            </Texto>

            <p className="font-semibold text-text mt-4 mb-2">1. Ativar e configurar (uma vez só)</p>
            <Passos>
              <li>Menu → <Botao>Feedback de Cliente</Botao></li>
              <li>Ative o toggle <Botao>Coleta de feedback</Botao> — vai gerar um link público pra você compartilhar</li>
              <li>Cadastre os brindes (ex: &ldquo;10% off na hidratação&rdquo;, &ldquo;limpeza de pele grátis&rdquo;). Para cada um, ajuste o <strong>peso</strong> (mais peso = mais comum no sorteio)</li>
              <li>Escolha a validade do brinde (15 / 30 / 60 / 90 dias)</li>
              <li>Escolha um <strong>brinde mínimo garantido</strong> (cliente nunca sai sem nada)</li>
              <li>Cole o link de avaliação do Google da sua barbearia (opcional). Quem dá 5 estrelas com comentário vai ser convidado a publicar no Google</li>
              <li>Salvar</li>
            </Passos>

            <p className="font-semibold text-text mt-4 mb-2">2. Compartilhar com clientes</p>
            <Passos>
              <li>Na tela de Feedback de Cliente, copie o link OU baixe o QR Code</li>
              <li>Cola o QR Code num cartaz na recepção ou nos espelhos</li>
              <li>Manda no grupo de WhatsApp da barbearia</li>
            </Passos>

            <p className="font-semibold text-text mt-4 mb-2">3. Ver os feedbacks recebidos</p>
            <Passos>
              <li>Na tela de Feedback de Cliente, clique em <Botao>Ver feedbacks</Botao></li>
              <li>Filtra por período, estrelas, barbeiro ou brinde</li>
              <li>Marque como &ldquo;lido&rdquo; ou arquive os antigos</li>
              <li>Quando o cliente vier resgatar o brinde, confira o código que ele apresenta e marque como <Botao>Usado</Botao></li>
            </Passos>
            <Dica>
              Quanto mais brindes ativos, mais o sorteio fica interessante. Recomendo 4 a 6 brindes de
              valor parecido pra ninguém sair frustrado.
            </Dica>
          </Secao>

          {/* Seção: Cards PNG */}
          <Secao id="cards" icon="🖼️" titulo="Cards PNG (mandar no WhatsApp)">
            <Texto>
              Gera uma imagem bonita do desempenho de cada barbeiro pra mandar no grupo. Bom pra
              celebração de meta batida ou ranking parcial.
            </Texto>
            <Passos>
              <li>Menu → <Botao>Cards PNG</Botao></li>
              <li>Escolha o barbeiro</li>
              <li>Escolha o tipo de card (progresso, comparativo, ranking)</li>
              <li>Clique em <Botao>Baixar PNG</Botao></li>
              <li>Manda no WhatsApp do grupo</li>
            </Passos>
          </Secao>

          {/* Seção: Fechar o mês */}
          <Secao id="fechar-mes" icon="🔒" titulo="Fechar o mês">
            <Texto>
              Fechar o mês é tipo dar um cadeado: ninguém edita lançamentos retroativos sem antes
              reabrir o mês. Importante pra premiação e auditoria.
            </Texto>
            <Passos>
              <li>Menu → <Botao>Dashboard</Botao> → botão <Botao>Fechar mês</Botao> (no topo)</li>
              <li>Confira os valores finais</li>
              <li>Clique em <Botao>Fechar</Botao></li>
              <li>Pra reabrir depois (corrigir algo): mesma tela, botão <Botao>Reabrir</Botao></li>
            </Passos>
            <Dica>
              Faça isso no dia do fechamento de ciclo. Se sua barbearia fecha dia 25, feche no dia 26
              de manhã (depois de lançar tudo do dia 25).
            </Dica>
          </Secao>

          {/* Seção: Resumo IA */}
          <Secao id="resumo-ia" icon="🤖" titulo="Resumo de reunião (IA)">
            <Texto>
              Gera um texto pronto pra você apresentar à equipe na reunião de início de mês —
              motivador, com as metas, prêmios e regras já explicadas. Você copia e cola no WhatsApp do grupo.
            </Texto>
            <Passos>
              <li>Menu → <Botao>Dashboard</Botao> → botão <Botao>Resumo de reunião</Botao></li>
              <li>Escolha o mês</li>
              <li>Clique em <Botao>Gerar resumo</Botao></li>
              <li>Edite o texto se quiser (pode personalizar)</li>
              <li>Copie e mande no grupo</li>
            </Passos>
          </Secao>

          {/* Seção: Modos de campanha */}
          <Secao id="modos" icon="⚙️" titulo="Quem lança a pontuação? (configuração importante)">
            <Texto>
              Na <Botao>Campanha de pontos</Botao>, aba <Botao>Configurações</Botao>, tem a pergunta
              <strong>&ldquo;Quem lança a pontuação diária?&rdquo;</strong> com 2 opções:
            </Texto>
            <Lista>
              <li><strong>Cada barbeiro lança a sua</strong> — o barbeiro abre o link dele, vai na aba &ldquo;Lançar dia&rdquo; e lança. Você só confere. (default)</li>
              <li><strong>Só o dono lança</strong> — esconde o botão de lançar no link do barbeiro. Você é o único que lança, pela tela <Botao>Lançamento de pontos</Botao></li>
            </Lista>
            <Dica>
              <strong>&ldquo;Cada barbeiro lança a sua&rdquo;</strong> dá mais autonomia mas exige confiança.
              <strong>&ldquo;Só o dono lança&rdquo;</strong> dá mais controle mas vira tarefa diária pra você.
              Escolha o que combina com seu time.
            </Dica>
          </Secao>

          {/* Seção: Configurações importantes */}
          <Secao id="config" icon="🎛️" titulo="Configurações que vale conhecer">
            <p className="font-semibold text-text mb-2">Aba Operação (mostrar/esconder no link do barbeiro)</p>
            <Lista>
              <li><strong>Visibilidade do ranking</strong>: completo · só posição (sem nomes) · só o próprio</li>
              <li><strong>Mostrar faturamento geral</strong>: o R$ da meta coletiva aparece pro barbeiro</li>
              <li><strong>Mostrar ticket médio</strong>: comissão / atendimentos</li>
              <li><strong>Modalidade</strong>: Equipe (default) ou Sozinho (autônomo — esconde tudo de ranking)</li>
              <li><strong>Dia de fechamento</strong>: define quando seu &ldquo;mês&rdquo; começa e termina (1 = mês calendário; outro = ciclo customizado tipo dia 26 a dia 25)</li>
            </Lista>

            <p className="font-semibold text-text mt-5 mb-2">Aba Identidade</p>
            <Lista>
              <li>Logo da barbearia</li>
              <li>Nome que aparece pros barbeiros e pros clientes (no link de feedback)</li>
            </Lista>

            <p className="font-semibold text-text mt-5 mb-2">Aba Conta</p>
            <Lista>
              <li>Seus dados de login</li>
              <li>Trocar senha (link separado)</li>
            </Lista>
          </Secao>

          {/* Seção: Dúvidas comuns */}
          <Secao id="duvidas" icon="❓" titulo="Dúvidas comuns">
            <Pergunta q="Esqueci de lançar um dia. Perdi?">
              Não. Vai em <Botao>Lançamento diário</Botao> e clica no seletor de data pra mudar o
              dia. Lança ali normal.
            </Pergunta>

            <Pergunta q="Lancei errado. Como editar?">
              <Botao>Lançamento de pontos</Botao> → escolhe o barbeiro e o dia → edita ou exclui. Pra
              comissão acumulada, edita direto no Dashboard.
            </Pergunta>

            <Pergunta q="O barbeiro não tá vendo o ranking">
              Vai em <Botao>Configurações</Botao> → aba <Botao>Operação</Botao> → verifica
              <em> Visibilidade do ranking</em>. Se tiver em &ldquo;só o próprio&rdquo;, é por isso.
            </Pergunta>

            <Pergunta q="Mês passado quero conferir, dá?">
              Sim. No Dashboard, na barra de cima, navegue entre meses (setas). Tudo (metas, ranking,
              comissão) aparece como ficou aquele mês.
            </Pergunta>

            <Pergunta q="Posso desabilitar o feedback de cliente?">
              Sim. <Botao>Feedback de Cliente</Botao> → desative o toggle. O link público para
              de funcionar na hora.
            </Pergunta>

            <Pergunta q="Como ver quem é o cliente que veio cobrar o brinde?">
              <Botao>Feedback de Cliente</Botao> → <Botao>Ver feedbacks</Botao> → filtra
              por brinde → você vê o nome do cliente, código de resgate e a data. Confira o código que
              ele apresentar antes de marcar como Usado.
            </Pergunta>

            <Pergunta q="Mudei o brinde de validade. Vale pros antigos?">
              Não. A validade fica congelada no momento que o brinde foi sorteado. Brindes antigos
              continuam com a validade que tinham na hora.
            </Pergunta>

            <Pergunta q="Cliente disse que o link tá pedindo login">
              Limpa o cache do navegador dele e tenta de novo. Se persistir, manda print pra gente.
            </Pergunta>
          </Secao>

          {/* Fim */}
          <div className="card p-5 text-center">
            <p className="text-text-muted text-sm font-sans">
              Não achou o que precisa? Fala com a gente.
            </p>
            <Link href="/treinamentos" className="btn-ghost text-sm mt-3 inline-flex">
              🎥 Ver os vídeos de treinamento
            </Link>
          </div>

        </main>
      </div>
    </div>
  )
}

// ── Componentes locais ────────────────────────────────────────────────────────

const SUMARIO = [
  { id: 'o-que-e',         icon: '🎯', titulo: 'O que é o BarberMeta?' },
  { id: 'primeira-config', icon: '🛠️', titulo: 'Primeira configuração' },
  { id: 'rotina',          icon: '📅', titulo: 'Rotina do dia a dia' },
  { id: 'link-barbeiro',   icon: '🔗', titulo: 'O link do barbeiro' },
  { id: 'feedback',        icon: '⭐', titulo: 'Feedback de Cliente' },
  { id: 'cards',           icon: '🖼️', titulo: 'Cards PNG' },
  { id: 'fechar-mes',      icon: '🔒', titulo: 'Fechar o mês' },
  { id: 'resumo-ia',       icon: '🤖', titulo: 'Resumo de reunião (IA)' },
  { id: 'modos',           icon: '⚙️', titulo: 'Quem lança a pontuação?' },
  { id: 'config',          icon: '🎛️', titulo: 'Configurações que vale conhecer' },
  { id: 'duvidas',         icon: '❓', titulo: 'Dúvidas comuns' },
]

function Secao({ id, icon, titulo, children }: { id: string; icon: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card p-5 sm:p-6 scroll-mt-20 space-y-3">
      <h2 className="font-serif text-xl sm:text-2xl text-text">
        <span className="mr-2">{icon}</span>{titulo}
      </h2>
      {children}
    </section>
  )
}

function Texto({ children }: { children: React.ReactNode }) {
  return <p className="text-text text-sm sm:text-[15px] font-sans leading-relaxed">{children}</p>
}

function Lista({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 text-text text-sm sm:text-[15px] font-sans leading-relaxed">
      {children}
    </ul>
  )
}

function Passos({ children }: { children: React.ReactNode }) {
  return (
    <ol className="list-decimal pl-5 space-y-1.5 text-text text-sm sm:text-[15px] font-sans leading-relaxed">
      {children}
    </ol>
  )
}

function Botao({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-1.5 py-0.5 rounded bg-surface-2 border border-border text-text text-[13px] font-sans">
      {children}
    </span>
  )
}

function Dica({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border-l-4 border-primary bg-primary/5 p-3.5 text-text text-sm font-sans leading-relaxed">
      <span className="font-semibold text-primary mr-1.5">💡 Dica:</span>
      {children}
    </div>
  )
}

function Pergunta({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="rounded-xl border border-border p-3 mt-2">
      <summary className="cursor-pointer text-text text-sm font-sans font-semibold">{q}</summary>
      <div className="mt-2 text-text-muted text-sm font-sans leading-relaxed">{children}</div>
    </details>
  )
}
