import { COR, money, mesAno } from './tokens'

export type DadosCard = {
  nome: string
  cidade: string | null
  qtdBarbeiros: number
  crescimentoPct: number
  antValor: number
  antMes: number | null
  antAno: number | null
  refValor: number
  refMes: number | null
  refAno: number | null
}

/**
 * A ARTE do card, sem nenhum I/O — recebe os dados e a logo já resolvidos.
 * Separado da rota justamente pra poder ser renderizado e conferido fora do
 * Next; layout de imagem só se valida olhando.
 *
 * Satori (motor do next/og) aceita um subconjunto de CSS: todo container
 * precisa de display:flex explícito e não existe grid. A raiz usa
 * space-between com TRÊS filhos diretos — marca, conteúdo e rodapé —, que é o
 * que mantém o rodapé colado embaixo em 4:5 e em 1:1 sem buraco no meio.
 */
/** Logo já baixada e com o tamanho de exibição resolvido. */
export type LogoBarbearia = { uri: string; largura: number; altura: number }

/** Iniciais do nome, pro caso de a barbearia não ter logo. */
function iniciais(nome: string) {
  const partes = nome.split(/\s+/).filter((p) => p.length > 1)
  return partes.slice(0, 2).map((p) => p[0]).join('').toUpperCase() || nome.slice(0, 2).toUpperCase()
}

/**
 * A MARCA DA BARBEARIA, no topo direito.
 *
 * Sempre ocupa a MESMA caixa, com logo ou sem: é o que impede o card de mudar
 * de composição conforme o cadastro do cliente. Com logo, a caixa é clara e a
 * imagem entra com `contain` — logo transparente precisa de fundo pra ser vista,
 * e `contain` é o que garante que nenhuma proporção seja esticada. Sem logo, a
 * mesma caixa recebe as iniciais em dourado: um acabamento próprio, não um
 * buraco onde a logo deveria estar.
 */
function MarcaBarbearia({ nome, logoBarbearia }: { nome: string; logoBarbearia: LogoBarbearia | null }) {
  const LADO = 148

  if (logoBarbearia) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: LADO, height: LADO, borderRadius: 34,
        backgroundColor: '#F4EFE7', padding: 18,
      }}>
        {/* Largura e altura vêm CALCULADAS da rota, já encaixadas na caixa.
            O Satori ignora object-fit e max-width — ele desenha no tamanho que
            recebe e corta o resto —, então passar os dois números exatos é o
            único jeito de uma logo larga não sair com as pontas cortadas. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori só entende <img>. */}
        <img
          src={logoBarbearia.uri}
          alt=""
          width={logoBarbearia.largura}
          height={logoBarbearia.altura}
        />
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: LADO, height: LADO, borderRadius: 34,
      backgroundColor: 'rgba(244,239,231,0.06)', border: `2px solid ${COR.borda}`,
    }}>
      <div style={{ display: 'flex', fontSize: 56, fontWeight: 800, color: COR.ouro, letterSpacing: 2 }}>
        {iniciais(nome)}
      </div>
    </div>
  )
}

export function CardCrescimento({ d, logo, logoBarbearia = null, vertical }: {
  d: DadosCard
  logo: string | null
  logoBarbearia?: LogoBarbearia | null
  vertical: boolean
}) {
  const subiu = d.crescimentoPct >= 0
  const corPct = subiu ? COR.verde : COR.vermelho
  const cidade = d.cidade ?? 'cidade não informada'
  const equipe = `${d.qtdBarbeiros} ${d.qtdBarbeiros === 1 ? 'barbeiro' : 'barbeiros'}`
  // Nome comprido quebra em duas linhas; encolher evita estourar a largura.
  const tamNome = d.nome.length > 30 ? 58 : d.nome.length > 20 ? 66 : 78

  return (
    <div
      style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: COR.fundo, padding: 80, position: 'relative',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Brilho de marca no canto — mesmo azul do primary. */}
      <div style={{
        position: 'absolute', top: -160, right: -160, width: 620, height: 620,
        borderRadius: 999, backgroundColor: COR.primary, opacity: 0.16, display: 'flex',
      }} />

      {/* 1. Marca: o PNG tem fundo próprio e, pequeno, virava um quadrado
          ilegível — vai maior, arredondado, e com o logotipo em texto ao lado. */}
      {/* A barbearia fica à DIREITA e o BarberMeta à esquerda: o post é sobre
          ela, mas quem assina o dado somos nós. Um em cada ponta deixa os dois
          legíveis sem competir. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element -- Satori só entende <img>; next/image não roda aqui.
            <img src={logo} height={92} width={92} alt="" style={{ borderRadius: 22, marginRight: 24 }} />
          )}
          <div style={{ display: 'flex', fontSize: 46, fontWeight: 700, color: COR.texto }}>
            Barber<span style={{ color: COR.ouro }}>Meta</span>
          </div>
        </div>

        <MarcaBarbearia nome={d.nome} logoBarbearia={logoBarbearia} />
      </div>

      {/* 2. Conteúdo: quem é + o número que o post existe pra contar. */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 20, letterSpacing: 4, color: COR.ouro, fontWeight: 700 }}>
          CRESCIMENTO REAL
        </div>
        <div style={{
          display: 'flex', fontSize: tamNome, fontWeight: 700,
          color: COR.texto, marginTop: 18, lineHeight: 1.05,
        }}>
          {d.nome}
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: COR.suave, marginTop: 16 }}>
          {cidade} · {equipe}
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', marginTop: vertical ? 64 : 44,
          border: `2px solid ${COR.borda}`, borderRadius: 32, padding: 52,
        }}>
          <div style={{ display: 'flex', fontSize: 128, fontWeight: 800, color: corPct, lineHeight: 1 }}>
            {subiu ? '+' : ''}{d.crescimentoPct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
          </div>
          <div style={{ display: 'flex', fontSize: 30, color: COR.suave, marginTop: 28 }}>
            de {money(d.antValor)} em {mesAno(d.antMes, d.antAno)}
          </div>
          <div style={{ display: 'flex', fontSize: 38, color: COR.texto, fontWeight: 700, marginTop: 10 }}>
            para {money(d.refValor)} em {mesAno(d.refMes, d.refAno)}
          </div>
        </div>
      </div>

      {/* 3. Rodapé: de onde vem o número. */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 26, color: COR.suave }}>
          Meses fechados, apurados no painel do BarberMeta.
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: COR.primary, fontWeight: 700, marginTop: 10 }}>
          barbermeta.com.br
        </div>
      </div>
    </div>
  )
}
