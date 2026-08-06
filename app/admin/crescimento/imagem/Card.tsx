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
export function CardCrescimento({ d, logo, vertical }: {
  d: DadosCard
  logo: string | null
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
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element -- Satori só entende <img>; next/image não roda aqui.
          <img src={logo} height={92} width={92} alt="" style={{ borderRadius: 22, marginRight: 24 }} />
        )}
        <div style={{ display: 'flex', fontSize: 46, fontWeight: 700, color: COR.texto }}>
          Barber<span style={{ color: COR.ouro }}>Meta</span>
        </div>
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
