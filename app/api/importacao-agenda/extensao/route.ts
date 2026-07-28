import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  hashLeituraExtensao,
  itensRpcExtensao,
  validarLeituraExtensao,
  validarTokenExtensao,
} from '@/lib/importacao-agenda/extensao-server'
import { lerRelatorioAgendaPdf } from '@/lib/importacao-agenda/pdf-server'
import type {
  LeituraRelatorioAgenda,
  ResultadoConfirmacaoAgenda,
} from '@/lib/importacao-agenda/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 4 * 1024 * 1024
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Authorization, Content-Type, X-Agenda-File-Name',
  'Cache-Control': 'no-store',
}

function respostaJson(
  corpo: Record<string, unknown>,
  status = 200,
): NextResponse {
  return NextResponse.json(corpo, {
    status,
    headers: CORS_HEADERS,
  })
}

function nomeArquivo(request: Request, dataRelatorio?: string): string {
  const informado = request.headers.get('x-agenda-file-name')
  if (informado) {
    return informado
      .replace(/[^\wÀ-ÿ._ -]/g, '')
      .slice(0, 200)
      .trim() || 'relatorio-agenda.pdf'
  }
  return `extensao-agenda-${dataRelatorio ?? 'relatorio'}.json`
}

function validarTamanho(request: Request): void {
  const tamanho = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(tamanho) && tamanho > MAX_BODY_BYTES) {
    throw new Error('O relatório excede o limite de 4 MB.')
  }
}

async function lerCorpo(
  request: Request,
): Promise<{ leitura: LeituraRelatorioAgenda; arquivoNome: string }> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''
  if (contentType.includes('application/pdf')) {
    const bytes = await request.arrayBuffer()
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_BODY_BYTES) {
      throw new Error('O PDF está vazio ou excede o limite de 4 MB.')
    }
    const arquivoNome = nomeArquivo(request)
    const arquivo = new File(
      [bytes],
      arquivoNome.toLowerCase().endsWith('.pdf')
        ? arquivoNome
        : `${arquivoNome}.pdf`,
      { type: 'application/pdf' },
    )
    return {
      leitura: await lerRelatorioAgendaPdf(arquivo),
      arquivoNome: arquivo.name,
    }
  }

  if (!contentType.includes('application/json')) {
    throw new Error('Envie dados JSON validados ou o PDF original do Agenda Serviço.')
  }
  const leitura = validarLeituraExtensao(await request.json())
  return {
    leitura,
    arquivoNome: nomeArquivo(request, leitura.periodoFim),
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: Request) {
  try {
    validarTokenExtensao(request)
    validarTamanho(request)
    const { leitura, arquivoNome } = await lerCorpo(request)
    const arquivoHash = hashLeituraExtensao(leitura)
    const supabase = createAdminClient()

    // A RPC de extensão apenas resolve o de-para já confirmado e delega a
    // gravação para confirmar_importacao_agenda, a mesma transação do PDF.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc(
      'confirmar_importacao_agenda_extensao',
      {
        p_arquivo_nome: arquivoNome,
        p_arquivo_hash: arquivoHash,
        p_periodo_inicio: leitura.periodoInicio,
        p_data_relatorio: leitura.periodoFim,
        p_itens: itensRpcExtensao(leitura),
      },
    )
    if (error) {
      console.error('[extensao-agenda] Falha na gravação protegida:', {
        code: error.code,
        message: error.message,
      })
      if (error.message?.includes('MAPEAMENTO_AUSENTE:')) {
        const nomes = error.message
          .split('MAPEAMENTO_AUSENTE:')[1]
          ?.split(/\r?\n/)[0]
          ?.trim()
        return respostaJson({
          error:
            `Falta confirmar o de-para de: ${nomes || 'um profissional'}. ` +
            'Abra “Importar relatório” no BarberMeta e confirme esse nome uma vez.',
          gravado: false,
        }, 409)
      }
      throw new Error(error.message || 'Não foi possível atualizar o BarberMeta.')
    }

    const resultado = data as ResultadoConfirmacaoAgenda
    console.info('[extensao-agenda] Atualização concluída:', {
      dataRelatorio: resultado.dataRelatorio,
      profissionais: resultado.profissionais,
      reimportacao: resultado.reimportacao,
    })
    return respostaJson({
      ok: true,
      gravado: true,
      barbeirosAtualizados: resultado.profissionais,
      resultado,
    })
  } catch (erro) {
    const mensagem = erro instanceof Error
      ? erro.message
      : 'Não foi possível atualizar o BarberMeta.'
    if (mensagem === 'TOKEN_EXTENSAO_INVALIDO') {
      return respostaJson({
        error: 'Token da extensão inválido.',
        gravado: false,
      }, 401)
    }
    if (mensagem === 'TOKEN_EXTENSAO_NAO_CONFIGURADO') {
      return respostaJson({
        error: 'A integração da extensão ainda não foi ativada no BarberMeta.',
        gravado: false,
      }, 503)
    }
    console.error('[extensao-agenda] Atualização recusada:', mensagem)
    return respostaJson({ error: mensagem, gravado: false }, 400)
  }
}
