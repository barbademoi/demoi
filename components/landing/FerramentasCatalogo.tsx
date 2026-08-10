'use client'

import { useState } from 'react'

type Categoria = 'Vendas' | 'Metas e equipe' | 'Gestão' | 'Acompanhamento'

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
    chamada: 'Transforme a meta do mês em um caminho visível todos os dias.',
    descricao: 'Configure metas individuais e coletivas em faturamento, comissão ou nos dois formatos. A equipe acompanha o avanço pelo celular e entende o ritmo necessário para chegar lá.',
    recursos: [
      'Metas Bronze, Prata e Ouro com prêmios por faixa',
      'Ritmo diário, dias úteis, ticket médio e comparação mensal',
      'Modo para equipe ou profissional autônomo',
    ],
    resultado: 'Menos cobrança no escuro e mais clareza sobre o próximo passo.',
  },
  {
    id: 'ranking',
    icone: '↗',
    nome: 'Ranking e destaques',
    categoria: 'Metas e equipe',
    chamada: 'Mostre quem está avançando e mantenha o jogo vivo durante o ciclo.',
    descricao: 'O ranking organiza barbeiros e recepcionistas separadamente, enquanto a área de destaques reconhece a evolução do mês sem misturar funções diferentes.',
    recursos: [
      'Ranking por metas ou por pontos de campanha',
      'Visibilidade configurável para cada profissional',
      'Histórico de desempenho dos últimos ciclos',
    ],
    resultado: 'A equipe enxerga posição, progresso e oportunidade de evolução.',
  },
  {
    id: 'campanhas',
    icone: '✦',
    nome: 'Campanhas de pontos',
    categoria: 'Metas e equipe',
    chamada: 'Direcione o foco para os serviços e produtos que você quer vender mais.',
    descricao: 'Crie campanhas, defina quantos pontos vale cada serviço e configure premiações por posição. O sistema mantém rankings próprios para barbeiros e recepção.',
    recursos: [
      'Serviços, quantidades e pontos totalmente configuráveis',
      'Prêmios por posição e pontuação mínima para participar',
      'Conferência detalhada da origem de cada ponto',
    ],
    resultado: 'Uma campanha comercial fácil de explicar e acompanhar.',
  },
  {
    id: 'premiacoes',
    icone: '◆',
    nome: 'Premiações',
    categoria: 'Metas e equipe',
    chamada: 'Saiba o que já foi conquistado e quanto ainda pode virar prêmio.',
    descricao: 'A área de premiações reúne metas da equipe e campanhas para mostrar ao dono os valores já garantidos e o potencial do ciclo por profissional.',
    recursos: [
      'Total garantido e total potencial do mês',
      'Detalhamento individual por colaborador',
      'Prêmios coletivos e individuais no mesmo resumo',
    ],
    resultado: 'Mais previsibilidade para premiar sem perder o controle dos custos.',
  },
  {
    id: 'lancamento',
    icone: '+',
    nome: 'Lançamento diário',
    categoria: 'Gestão',
    chamada: 'Atualize os números da equipe em poucos minutos pelo celular.',
    descricao: 'Registre faturamento, comissão e quantidade de atendimentos de cada profissional. Os valores alimentam automaticamente metas, ranking, ticket médio e comissões.',
    recursos: [
      'Lançamento simples por profissional e por dia',
      'Compatível com faturamento, comissão ou ambos',
      'Proteção contra apagar um valor já salvo por engano',
    ],
    resultado: 'Uma rotina curta de atualização que mantém todo o painel confiável.',
  },
  {
    id: 'historico',
    icone: '≡',
    nome: 'Histórico e conferência',
    categoria: 'Gestão',
    chamada: 'Encontre, confira e corrija o que foi lançado sem perder o controle.',
    descricao: 'Filtre lançamentos por profissional e período, revise pontos por origem e edite ou exclua registros quando necessário. Ciclos concluídos também podem ser fechados.',
    recursos: [
      'Filtros por profissional e intervalo de datas',
      'Edição e exclusão de lançamentos do dia',
      'Relatório de conferência dos pontos da campanha',
    ],
    resultado: 'Números rastreáveis para o dono tomar decisões com segurança.',
  },
  {
    id: 'cards',
    icone: '▣',
    nome: 'Cards para WhatsApp',
    categoria: 'Acompanhamento',
    chamada: 'Leve o progresso para onde a equipe já conversa todos os dias.',
    descricao: 'Gere artes prontas com a evolução individual e o ranking do ciclo. Você pode baixar um card, o ranking completo ou todos de uma vez em um arquivo ZIP.',
    recursos: [
      'Card individual com meta e progresso',
      'Card do ranking da equipe',
      'Download em PNG para compartilhar no WhatsApp',
    ],
    resultado: 'Reconhecimento rápido, visual e fácil de compartilhar.',
  },
  {
    id: 'brindoleta',
    icone: '◉',
    nome: 'Brindoleta',
    categoria: 'Vendas',
    chamada: 'Transforme o QR Code do profissional em uma oportunidade de venda extra.',
    descricao: 'O cliente gira uma roleta no próprio celular, descobre uma oferta e informa o nome somente se aceitar. O dono confirma a venda realizada antes de ela entrar nos resultados.',
    recursos: [
      'Até 6 ofertas com chance, estoque, cor e descrição configuráveis',
      'QR Code individual por profissional, pronto para imprimir em PDF',
      'Vendas pendentes, confirmação do dono e resultado por colaborador',
    ],
    resultado: 'Uma experiência divertida que ajuda a oferecer sem criar pressão.',
  },
  {
    id: 'feedback',
    icone: '★',
    nome: 'Feedback Premiado',
    categoria: 'Vendas',
    chamada: 'Colete opiniões, premie clientes e fortaleça sua reputação.',
    descricao: 'Compartilhe um link ou QR Code para o cliente avaliar o atendimento. Feedbacks positivos podem seguir para o Google; os demais ficam no painel para melhoria interna.',
    recursos: [
      'Brindes com peso, validade e código de resgate',
      'Painel com filtros e controle de brindes utilizados',
      'Pontos opcionais para o profissional após feedback positivo',
    ],
    resultado: 'Mais aprendizado sobre a experiência e mais avaliações no momento certo.',
  },
  {
    id: 'financeiro',
    icone: 'R$',
    nome: 'Financeiro',
    categoria: 'Gestão',
    chamada: 'Veja caixa, compromissos e folha sem misturar empresa e vida pessoal.',
    descricao: 'Organize contas a pagar e receber, saldos por conta e pagamentos da equipe. As comissões podem ser trazidas dos lançamentos do BarberMeta e ajustadas com bônus ou descontos.',
    recursos: [
      'Contas únicas, fixas ou parceladas e caixa por conta',
      'Visões separadas para empresa e pessoal',
      'Folha, baixa de pagamento e card em PNG para o colaborador',
    ],
    resultado: 'Uma visão prática de quanto entrou, quanto falta pagar e quanto sobra.',
  },
  {
    id: 'comportamento',
    icone: '✓',
    nome: 'Comportamento',
    categoria: 'Metas e equipe',
    chamada: 'Acompanhe atitudes importantes sem misturar conduta com vendas.',
    descricao: 'Cadastre regras positivas ou negativas, registre ocorrências e mantenha um histórico por profissional. A equipe também pode enviar recados identificados ou anônimos.',
    recursos: [
      'Regras e ajustes de comportamento com pontuação própria',
      'Ciência do profissional sobre cada registro',
      'Caixa de mensagens com opção anônima',
    ],
    resultado: 'Conversas mais objetivas e um histórico claro para desenvolver a equipe.',
  },
  {
    id: 'equipe',
    icone: '●',
    nome: 'Equipe e acessos',
    categoria: 'Gestão',
    chamada: 'Cadastre a operação e entregue a cada profissional a visão certa.',
    descricao: 'Adicione barbeiros e recepcionistas com foto e dias de trabalho. Cada profissional recebe um link individual para acompanhar seus números sem criar conta ou senha.',
    recursos: [
      'Cadastro, foto, ativação e organização da equipe',
      'Link individual e acesso simples pelo celular',
      'Controle de ranking, ticket médio e faturamento exibidos',
    ],
    resultado: 'Mais autonomia para a equipe sem abrir informações que o dono quer preservar.',
  },
  {
    id: 'reuniao',
    icone: '✎',
    nome: 'Resumo com IA',
    categoria: 'Acompanhamento',
    chamada: 'Chegue à reunião com os principais números do ciclo organizados.',
    descricao: 'O BarberMeta usa os resultados registrados para gerar um resumo de apoio à reunião, destacando evolução, pontos de atenção e temas para conversar com a equipe.',
    recursos: [
      'Resumo baseado nos dados reais do ciclo',
      'Leitura rápida antes da conversa com o time',
      'Complemento aos rankings, metas e destaques',
    ],
    resultado: 'Reuniões mais preparadas e menos dependentes da memória do dono.',
  },
  {
    id: 'suporte',
    icone: '?',
    nome: 'Aulas e suporte',
    categoria: 'Acompanhamento',
    chamada: 'Você recebe o sistema e também ajuda para colocá-lo na rotina.',
    descricao: 'A área de aulas explica o uso das ferramentas. Assinantes também participam da comunidade ativa no WhatsApp e contam com suporte humanizado.',
    recursos: [
      'Tutoriais práticos dentro do sistema',
      'Comunidade de donos de barbearia no WhatsApp',
      'Suporte feito por pessoas e atualizações contínuas',
    ],
    resultado: 'Mais segurança para configurar, testar e continuar usando.',
  },
]

const categorias: Categoria[] = ['Vendas', 'Metas e equipe', 'Gestão', 'Acompanhamento']

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
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F4B942]">Por dentro do BarberMeta</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-[-0.025em] text-white sm:text-4xl">
            Clique em uma ferramenta e veja exatamente o que ela faz.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#B8C3D1] sm:text-lg">
            Mapeamos os recursos reais do sistema para você conhecer tudo sem transformar esta página em um manual interminável.
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
          Recursos descritos a partir das telas e fluxos atuais do BarberMeta. Novos assinantes recebem os módulos ativos incluídos na assinatura.
        </p>
      </div>
    </section>
  )
}
