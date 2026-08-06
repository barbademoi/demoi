import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@/lib/supabase/server'
import { emailEhAdminCortesia } from '@/lib/admin/cortesia'
import { listarCrescimentoBarbearias } from '../actions'
import { CardCrescimento } from './Card'

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

  return new ImageResponse(
    <CardCrescimento
      d={{
        nome: r.nome, cidade: r.cidade, qtdBarbeiros: r.qtdBarbeiros,
        crescimentoPct: r.crescimentoPct,
        antValor: r.antValor, antMes: r.antMes, antAno: r.antAno,
        refValor: r.refValor, refMes: r.refMes, refAno: r.refAno,
      }}
      logo={logo}
      vertical={vertical}
    />,
    { width: largura, height: altura },
  )
}
