import { NextResponse } from 'next/server'
import { obterAcessoImportacaoAgenda } from '@/lib/importacao-agenda/acesso-server'
import { lerRelatorioAgendaPdf } from '@/lib/importacao-agenda/pdf-server'
import { lerMapeamentosAgenda } from '@/lib/importacao-agenda/request-server'
import {
  hashArquivoAgenda,
  montarPreviewConfirmacaoAgenda,
} from '@/lib/importacao-agenda/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const acesso = await obterAcessoImportacaoAgenda()
  if ('error' in acesso) {
    return NextResponse.json({ error: acesso.error }, { status: acesso.status })
  }

  try {
    const formData = await request.formData()
    const arquivo = formData.get('arquivo')
    if (!(arquivo instanceof File)) {
      return NextResponse.json(
        { error: 'Selecione novamente o PDF do Agenda Serviço.' },
        { status: 400 },
      )
    }
    const mapeamentos = lerMapeamentosAgenda(formData)
    const [leitura, arquivoHash] = await Promise.all([
      lerRelatorioAgendaPdf(arquivo),
      hashArquivoAgenda(arquivo),
    ])
    const preview = await montarPreviewConfirmacaoAgenda(
      acesso.supabase as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      acesso.barbeariaId,
      acesso.diaFechamento,
      leitura,
      mapeamentos,
      arquivoHash,
    )
    return NextResponse.json({ preview })
  } catch (erro) {
    const mensagem = erro instanceof Error
      ? erro.message
      : 'Não foi possível preparar a confirmação.'
    return NextResponse.json({ error: mensagem }, { status: 400 })
  }
}
