import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { obterAcessoImportacaoAgenda } from '@/lib/importacao-agenda/acesso-server'
import { lerRelatorioAgendaPdf } from '@/lib/importacao-agenda/pdf-server'
import { lerMapeamentosAgenda } from '@/lib/importacao-agenda/request-server'
import {
  hashArquivoAgenda,
  montarPreviewConfirmacaoAgenda,
} from '@/lib/importacao-agenda/server'
import type { ResultadoConfirmacaoAgenda } from '@/lib/importacao-agenda/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const acesso = await obterAcessoImportacaoAgenda()
  if ('error' in acesso) {
    return NextResponse.json({ error: acesso.error }, { status: acesso.status })
  }

  try {
    const formData = await request.formData()
    if (formData.get('confirmado') !== 'true') {
      throw new Error('Confira os valores e marque a confirmação antes de gravar.')
    }
    const arquivo = formData.get('arquivo')
    if (!(arquivo instanceof File)) {
      throw new Error('Selecione novamente o PDF do Agenda Serviço.')
    }
    const hashEsperado = formData.get('arquivoHash')
    if (typeof hashEsperado !== 'string' || !/^[a-f0-9]{64}$/.test(hashEsperado)) {
      throw new Error('A pré-visualização expirou. Revise o relatório novamente.')
    }

    const mapeamentos = lerMapeamentosAgenda(formData)
    const [leitura, arquivoHash] = await Promise.all([
      lerRelatorioAgendaPdf(arquivo),
      hashArquivoAgenda(arquivo),
    ])
    if (arquivoHash !== hashEsperado) {
      throw new Error('O arquivo mudou depois da pré-visualização. Revise os valores novamente.')
    }

    // Revalida a leitura, o de-para, a barbearia e o ciclo imediatamente
    // antes da transação. A função do banco repete as travas críticas.
    const preview = await montarPreviewConfirmacaoAgenda(
      acesso.supabase as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      acesso.barbeariaId,
      acesso.diaFechamento,
      leitura,
      mapeamentos,
      arquivoHash,
    )
    if (preview.cicloFechado) {
      throw new Error('O ciclo está fechado. Reabra-o antes de confirmar.')
    }

    const itens = preview.linhas.map(linha => ({
      nomeRelatorio: linha.nomeRelatorio,
      barbeiroId: linha.barbeiroId,
      faturamentoAcumulado: linha.faturamentoAcumulado,
      comissaoAcumulada: linha.comissaoAcumulada,
    }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (acesso.supabase as any).rpc(
      'confirmar_importacao_agenda',
      {
        p_arquivo_nome: arquivo.name,
        p_arquivo_hash: arquivoHash,
        p_periodo_inicio: leitura.periodoInicio,
        p_data_relatorio: leitura.periodoFim,
        p_itens: itens,
      },
    )
    if (error) {
      console.error('[importacao-agenda] Falha na confirmação transacional:', error)
      throw new Error(error.message || 'Não foi possível confirmar a importação.')
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/lancamento-diario')
    revalidatePath('/dashboard/importar-relatorio')
    revalidatePath('/cards')
    revalidatePath('/b/[codigo]', 'page')
    return NextResponse.json({ resultado: data as ResultadoConfirmacaoAgenda })
  } catch (erro) {
    const mensagem = erro instanceof Error
      ? erro.message
      : 'Não foi possível confirmar a importação.'
    return NextResponse.json(
      { error: mensagem, gravado: false },
      { status: 400 },
    )
  }
}
