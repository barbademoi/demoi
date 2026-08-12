import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailEhAdminCortesia } from '@/lib/admin/cortesia'
import { listarCrescimentoBarbearias } from '../actions'
import { CardCrescimento, type LogoBarbearia } from './Card'
import { dimensoesDaImagem, encaixar } from '@/lib/imagem/dimensoes'

/**
 * CARD DE CONTEÚDO — PNG pronto pra postar, com o crescimento de UMA barbearia.
 *
 * Gerado com o ImageResponse do próprio Next (next/og), que já vem no
 * framework: não precisa de Chromium nem de dependência nova. O projeto não
 * tinha gerador de imagem em uso — o html2canvas está no package.json mas não
 * é chamado em lugar nenhum, e as telas de "impressão" são HTML com CSS de
 * print, que o navegador transforma em PDF.
 *
 * Só sai imagem de barbearia com DADO CONFIÁVEL: os mesmos filtros da lista
 * (mês fechado, acima do piso, bem alimentado) são reaplicados aqui no
 * servidor. Um link montado à mão pra uma barbearia de base fraca recebe 422 —
 * a trava não pode viver só no botão.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Mesma trava da página: só a conta de admin.
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !emailEhAdminCortesia(user.email)) {
    return new Response('Sem permissão.', { status: 403 })
  }

  const q = req.nextUrl.searchParams
  const id = q.get('id') ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response('Barbearia inválida.', { status: 400 })

  const vertical = (q.get('formato') ?? '4x5') !== '1x1'
  const largura = 1080
  const altura = vertical ? 1350 : 1080

  // Recalcula com os MESMOS filtros da tela, pra imagem e lista nunca
  // divergirem — inclusive se o admin tiver mexido nos pisos.
  const { rows } = await listarCrescimentoBarbearias({
    ciclos:       Number(q.get('ciclos')),
    piso:         Number(q.get('piso')),
    diasMinimos:  Number(q.get('dias')),
    mesesMinimos: Number(q.get('meses')),
    outlierPct:   Number(q.get('outlier')),
  })

  const r = rows.find((x) => x.barbeariaId === id)
  if (!r) return new Response('Barbearia não encontrada.', { status: 404 })
  if (!r.confiavel || r.crescimentoPct === null) {
    return new Response('Sem dado confiável pra gerar imagem desta barbearia.', { status: 422 })
  }

  // Logo do próprio projeto, embutida em base64 (o Satori não busca URL relativa).
  let logo: string | null = null
  try {
    const bytes = await readFile(path.join(process.cwd(), 'public', 'logo-barbermeta.png'))
    logo = `data:image/png;base64,${bytes.toString('base64')}`
  } catch {
    // Sem o arquivo, cai no logotipo em texto — o card não deixa de sair.
  }

  // Logo DA BARBEARIA. Vem pelo client de serviço porque o RLS de `barbearias`
  // é `id = get_barbearia_id()`: nem o admin lê a linha de outra barbearia com
  // o client do usuário.
  const logoBarbearia = await carregarLogoBarbearia(id)

  return renderizar(r, logo, logoBarbearia, vertical, largura, altura)
}

/**
 * Baixa a logo e devolve como data URI.
 *
 * Não passo a URL direto pro Satori de propósito: ele buscaria a imagem no meio
 * da renderização e, se a URL estivesse quebrada, lenta ou fosse um formato que
 * ele não decodifica, a geração INTEIRA falharia — o admin clicaria em baixar e
 * receberia um erro em vez do card. Baixando aqui, qualquer problema vira
 * apenas "sem logo", e o card sai do mesmo jeito.
 */
const CAIXA_LOGO = 112  // 148 do chip menos o respiro interno

async function carregarLogoBarbearia(barbeariaId: string): Promise<LogoBarbearia | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (createAdminClient() as any)
      .from('barbearias').select('logo_url').eq('id', barbeariaId).maybeSingle()

    const url = String(data?.logo_url ?? '').trim()
    if (!/^https:\/\//i.test(url)) return null

    const resp = await fetch(url, { signal: AbortSignal.timeout(5000), cache: 'no-store' })
    if (!resp.ok) return null

    const tipo = (resp.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
    // SVG fica de fora: o Satori não rasteriza SVG dentro de <img>, e o
    // resultado seria um buraco no lugar da logo.
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'].includes(tipo)) return null

    const buf = Buffer.from(await resp.arrayBuffer())
    // Logo gigante inflaria o PNG final sem melhorar nada na tela.
    if (buf.byteLength > 3_000_000) return null

    // Sem saber a proporção real não dá pra encaixar sem cortar — e um corte
    // silencioso na logo do cliente é pior do que não mostrar logo nenhuma.
    const dim = dimensoesDaImagem(buf)
    if (!dim) return null
    const cabe = encaixar({ largura: dim.largura, altura: dim.altura }, CAIXA_LOGO)

    return {
      uri: `data:${tipo};base64,${buf.toString('base64')}`,
      largura: cabe.largura,
      altura: cabe.altura,
    }
  } catch {
    return null
  }
}

/**
 * Gera o PNG. Se a logo da barbearia derrubar o Satori (formato que ele não
 * decodifica, apesar do content-type), tenta DE NOVO sem ela — a imagem tem que
 * sair, sempre. É a última rede de proteção depois da validação acima.
 */
function renderizar(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  r: any, logo: string | null, logoBarbearia: LogoBarbearia | null,
  vertical: boolean, largura: number, altura: number,
) {
  const montar = (lb: LogoBarbearia | null) => new ImageResponse(
    <CardCrescimento
      d={{
        nome: r.nome, cidade: r.cidade, qtdBarbeiros: r.qtdBarbeiros,
        crescimentoPct: r.crescimentoPct,
        antValor: r.antValor, antMes: r.antMes, antAno: r.antAno,
        refValor: r.refValor, refMes: r.refMes, refAno: r.refAno,
      }}
      logo={logo}
      logoBarbearia={lb}
      vertical={vertical}
    />,
    { width: largura, height: altura },
  )

  try {
    return montar(logoBarbearia)
  } catch (e) {
    console.error('[crescimento/imagem] logo da barbearia derrubou a geração:', e)
    return montar(null)
  }
}
