'use client'

import { useState } from 'react'

type Categoria = 'Vendas' | 'Metas e equipe' | 'Organização' | 'Acompanhamento'

type Ferramenta = {
  id: string
  icone: string
  nome: string
  categoria: Categoria
  chamada: string
  descricao: string
  recursos: string[]
  resultado: string
}

const ferramentas: Ferramenta[] = [
  {
    id: 'metas',
    icone: '◎',
    nome: 'Metas e ritmo',
    categoria: 'Metas e equipe',
    chamada: 'Todo mundo sabe quanto falta e o que precisa fazer hoje.',
    descricao: 'Você define a meta de cada profissional e da barbearia. O BarberMeta mostra o avanço pelo celular e calcula o ritmo necessário para chegar ao resultado.',
    recursos: [
      'Metas Bronze, Prata e Ouro com prêmios por faixa',
      'Quanto falta, ritmo por dia e quanto cada cliente gasta em média',
      'Funciona com equipe ou para quem trabalha sozinho',
    ],
    resultado: 'Menos cobrança no escuro e mais clareza sobre o próximo passo.',
  },
  {
    id: 'ranking',
    icone: '↗',
    nome: 'Ranking e destaques',
    categoria: 'Metas e equipe',
    chamada: 'Mostre a evolução sem precisar cobrar a equipe o tempo todo.',
    descricao: 'Cada profissional acompanha sua posição e seu avanço. Barbeiros e recepcionistas aparecem em listas separadas para a comparação ser justa.',
    recursos: [
      'Ranking por metas ou por pontos de campanha',
      'Visibilidade configurável para cada profissional',
      'Histórico dos últimos meses',
    ],
    resultado: 'A equipe enxerga posição, progresso e oportunidade de evolução.',
  },
  {
    id: 'campanhas',
    icone: '✦',
    nome: 'Campanhas de pontos',
    categoria: 'Metas e equipe',
    chamada: 'Coloque a equipe para focar no que você quer vender mais.',
    descricao: 'Escolha os serviços ou produtos da campanha, defina os pontos e cadastre os prêmios. Barbeiros e recepção acompanham seus próprios rankings.',
    recursos: [
      'Você escolhe os serviços, as quantidades e os pontos',
      'Prêmios por posição e quantidade mínima de pontos',
      'Relatório mostrando de onde veio cada ponto',
    ],
    resultado: 'Uma campanha comercial fácil de explicar e acompanhar.',
  },
  {
    id: 'premiacoes',
    icone: '◆',
    nome: 'Premiações',
    categoria: 'Metas e equipe',
    chamada: 'Veja os prêmios conquistados antes de fechar o mês.',
    descricao: 'O dono acompanha quanto cada profissional já conquistou e quanto ainda pode ganhar com as metas e campanhas do mês.',
    recursos: [
      'Quanto já foi conquistado e quanto ainda pode ser ganho',
      'Detalhes de cada profissional',
      'Prêmios coletivos e individuais no mesmo resumo',
    ],
    resultado: 'Mais previsibilidade para premiar sem perder o controle dos custos.',
  },
  {
    id: 'lancamento',
    icone: '+',
    nome: 'Lançamento diário',
    categoria: 'Organização',
    chamada: 'Atualize os números da equipe em poucos minutos pelo celular.',
    descricao: 'Informe quanto cada profissional vendeu, recebeu de comissão e quantos clientes atendeu. A partir daí, metas e rankings são atualizados.',
    recursos: [
      'Lançamento simples por profissional e por dia',
      'Acompanhe vendas, comissão ou os dois',
      'Proteção contra apagar um valor já salvo por engano',
    ],
    resultado: 'Uma rotina curta de atualização que mantém todo o painel confiável.',
  },
  {
    id: 'historico',
    icone: '≡',
    nome: 'Histórico e conferência',
    categoria: 'Organização',
    chamada: 'Encontre e corrija um lançamento sempre que precisar.',
    descricao: 'Escolha o profissional e o período para conferir o que foi informado. Você pode editar, excluir e também fechar um mês já concluído.',
    recursos: [
      'Filtros por profissional e intervalo de datas',
      'Edição e exclusão de lançamentos do dia',
      'Relatório mostrando como os pontos foram somados',
    ],
    resultado: 'Números rastreáveis para o dono tomar decisões com segurança.',
  },
  {
    id: 'cards',
    icone: '▣',
    nome: 'Cards para WhatsApp',
    categoria: 'Acompanhamento',
    chamada: 'Compartilhe o resultado no grupo em poucos toques.',
    descricao: 'Crie imagens prontas com a evolução de cada profissional e o ranking do mês. Baixe uma imagem ou todas de uma vez para enviar no WhatsApp.',
    recursos: [
      'Card individual com meta e progresso',
      'Card do ranking da equipe',
      'Imagens prontas para compartilhar no WhatsApp',
    ],
    resultado: 'Reconhecimento rápido, visual e fácil de compartilhar.',
  },
  {
    id: 'brindoleta',
    icone: '◉',
    nome: 'Brindoleta',
    categoria: 'Vendas',
    chamada: 'Ajude cada profissional a oferecer mais durante o atendimento.',
    descricao: 'O cliente gira a roleta no celular e descobre uma oferta. Só informa o nome se aceitar. Depois, o dono confirma se a venda realmente aconteceu.',
    recursos: [
      'Até 6 ofertas com chance e quantidade disponíveis',
      'QR Code de cada profissional pronto para imprimir',
      'Vendas aguardando confirmação e resultado por profissional',
    ],
    resultado: 'Uma experiência divertida que ajuda a oferecer sem criar pressão.',
  },
  {
    id: 'feedback',
    icone: '★',
    nome: 'Feedback Premiado',
    categoria: 'Vendas',
    chamada: 'Ouça o cliente e descubra o que está funcionando.',
    descricao: 'O cliente deixa a opinião por um link ou QR Code e pode receber um brinde. Avaliações positivas recebem a opção de ir ao Google; as outras ficam só para o dono.',
    recursos: [
      'Brindes com chance, validade e código para usar',
      'Lista de opiniões e controle dos brindes usados',
      'O profissional pode ganhar pontos por uma boa avaliação',
    ],
    resultado: 'Mais aprendizado sobre a experiência e mais avaliações no momento certo.',
  },
  {
    id: 'financeiro',
    icone: 'R$',
    nome: 'Financeiro',
    categoria: 'Organização',
    chamada: 'Entenda quanto entrou, quanto precisa pagar e quanto vai sobrar.',
    descricao: 'Organize o dinheiro da barbearia de forma simples. Registre contas, acompanhe os saldos e prepare o pagamento da equipe com comissões, bônus e descontos.',
    recursos: [
      'Contas únicas, mensais ou parceladas',
      'Dinheiro da empresa separado do dinheiro pessoal',
      'Pagamento da equipe e comprovante em imagem',
    ],
    resultado: 'Uma visão prática de quanto entrou, quanto falta pagar e quanto sobra.',
  },
  {
    id: 'comportamento',
    icone: '✓',
    nome: 'Comportamento',
    categoria: 'Metas e equipe',
    chamada: 'Combine regras claras e acompanhe as atitudes da equipe.',
    descricao: 'Cadastre comportamentos positivos e negativos, faça anotações por profissional e mantenha um histórico. A equipe também pode mandar recados com nome ou sem se identificar.',
    recursos: [
      'Regras de comportamento separadas das metas de venda',
      'O profissional confirma que leu cada anotação',
      'Mensagens com nome ou anônimas',
    ],
    resultado: 'Conversas mais objetivas e um histórico claro para desenvolver a equipe.',
  },
  {
    id: 'equipe',
    icone: '●',
    nome: 'Equipe e acessos',
    categoria: 'Organização',
    chamada: 'Cadastre a operação e entregue a cada profissional a visão certa.',
    descricao: 'Cadastre barbeiros e recepcionistas com foto e dias de trabalho. Cada um recebe um link próprio para acompanhar seus resultados sem criar conta ou senha.',
    recursos: [
      'Cadastro, foto, ativação e organização da equipe',
      'Link individual e acesso simples pelo celular',
      'Você escolhe quais números a equipe pode ver',
    ],
    resultado: 'Mais autonomia para a equipe sem abrir informações que o dono quer preservar.',
  },
  {
    id: 'reuniao',
    icone: '✎',
    nome: 'Resumo para reunião',
    categoria: 'Acompanhamento',
    chamada: 'Prepare a conversa com a equipe sem depender da memória.',
    descricao: 'O BarberMeta usa os resultados do mês para preparar um resumo com avanços, pontos de atenção e assuntos importantes para a reunião.',
    recursos: [
      'Resumo baseado nos números reais do mês',
      'Leitura rápida antes de conversar com a equipe',
      'Complemento aos rankings, metas e destaques',
    ],
    resultado: 'Reuniões mais preparadas e menos dependentes da memória do dono.',
  },
  {
    id: 'suporte',
    icone: '?',
    nome: 'Aulas e suporte',
    categoria: 'Acompanhamento',
    chamada: 'Você recebe ajuda para colocar tudo em prática.',
    descricao: 'As aulas mostram como usar cada ferramenta. Assinantes também entram na comunidade do WhatsApp e podem falar com nosso suporte.',
    recursos: [
      'Aulas práticas dentro do BarberMeta',
      'Comunidade de donos de barbearia no WhatsApp',
      'Suporte feito por pessoas e atualizações contínuas',
    ],
    resultado: 'Mais segurança para configurar, testar e continuar usando.',
  },
]

const categorias: Categoria[] = ['Vendas', 'Metas e equipe', 'Organização', 'Acompanhamento']

export default function FerramentasCatalogo() {
  const [selecionadaId, setSelecionadaId] = useState('metas')
  const selecionada = ferramentas.find((item) => item.id === selecionadaId) ?? ferramentas[0]

  function selecionarFerramenta(id: string) {
    setSelecionadaId(id)
    if (window.innerWidth < 1024) {
      window.requestAnimationFrame(() => {
        document.getElementById('detalhe-ferramenta')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }

  return (
    <section id="ferramentas" className="scroll-mt-20 bg-[#07111F] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F4B942]">Como o BarberMeta ajuda</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-[-0.025em] text-white sm:text-4xl">
            Veja como colocar a equipe em movimento no dia a dia.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#B8C3D1] sm:text-lg">
            Clique em uma ferramenta. A explicação aparece ao lado, de um jeito simples e direto.
          </p>
        </div>

        <div className="mt-10 grid overflow-hidden rounded-[28px] border border-white/10 bg-[#0D1929] shadow-2xl shadow-black/20 lg:grid-cols-[.92fr_1.08fr]">
          <div className="border-b border-white/10 p-4 sm:p-6 lg:border-b-0 lg:border-r">
            <p className="px-1 text-xs font-bold uppercase tracking-[0.15em] text-[#8FA0B3]">Escolha para conhecer</p>
            <div className="mt-4 space-y-5" role="tablist" aria-label="Ferramentas do BarberMeta">
              {categorias.map((categoria) => (
                <div key={categoria}>
                  <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#F4B942]/80">{categoria}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ferramentas.filter((item) => item.categoria === categoria).map((item) => {
                      const ativa = item.id === selecionada.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="tab"
                          aria-selected={ativa}
                          aria-controls="detalhe-ferramenta"
                          onClick={() => selecionarFerramenta(item.id)}
                          className={`group flex min-h-[58px] items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-xs font-bold leading-tight transition-all sm:text-sm ${ativa
                            ? 'border-[#F4B942] bg-[#F4B942] text-[#101828] shadow-lg shadow-[#F4B942]/10'
                            : 'border-white/10 bg-white/[0.035] text-[#D6DEE8] hover:border-white/25 hover:bg-white/[0.07]'
                          }`}
                        >
                          <span aria-hidden="true" className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-black ${ativa ? 'bg-[#101828] text-[#F4B942]' : 'bg-white/10 text-[#F4B942]'}`}>
                            {item.icone}
                          </span>
                          <span>{item.nome}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <article
            id="detalhe-ferramenta"
            role="tabpanel"
            aria-live="polite"
            className="relative flex min-h-[560px] scroll-mt-20 flex-col justify-center overflow-hidden p-6 sm:p-9 lg:p-12"
          >
            <div aria-hidden="true" className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#1E63E9]/20 blur-3xl" />
            <div aria-hidden="true" className="absolute -bottom-28 -left-24 h-64 w-64 rounded-full bg-[#F4B942]/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4B942] text-sm font-black text-[#101828] shadow-lg shadow-[#F4B942]/15">{selecionada.icone}</span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#F4B942]">{selecionada.categoria}</p>
                  <h3 className="mt-0.5 text-2xl font-bold tracking-[-0.02em] text-white sm:text-3xl">{selecionada.nome}</h3>
                </div>
              </div>

              <p className="mt-6 text-xl font-bold leading-snug text-white sm:text-2xl">{selecionada.chamada}</p>
              <p className="mt-4 text-base leading-relaxed text-[#B8C3D1]">{selecionada.descricao}</p>

              <ul className="mt-6 space-y-3">
                {selecionada.recursos.map((recurso) => (
                  <li key={recurso} className="flex items-start gap-3 text-sm leading-relaxed text-[#D6DEE8] sm:text-base">
                    <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-xs font-black text-emerald-300">✓</span>
                    <span>{recurso}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 rounded-2xl border border-[#F4B942]/20 bg-[#F4B942]/[0.07] px-4 py-3.5">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#F4B942]">Na prática</p>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-white">{selecionada.resultado}</p>
              </div>

              <a href="#preco" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-black text-[#101828] transition-colors hover:bg-[#F4B942] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4B942]">
                Quero todas essas ferramentas →
              </a>
            </div>
          </article>
        </div>

        <p className="mt-4 text-center text-xs leading-relaxed text-[#8FA0B3]">
          As ferramentas mostradas acima estão incluídas para novos assinantes.
        </p>
      </div>
    </section>
  )
}
