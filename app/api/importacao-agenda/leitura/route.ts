import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailTemImportacao } from '@/lib/importacao/access'
import { lerRelatorioAgendaPdf } from '@/lib/importacao-agenda/pdf-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }
  if (!emailTemImportacao(user.email ?? null)) {
    return NextResponse.json(
      { error: 'Sem acesso à importação em teste.' },
      { status: 403 },
    )
  }

  try {
    const formData = await request.formData()
    const arquivo = formData.get('arquivo')
    if (!(arquivo instanceof File)) {
      return NextResponse.json(
        { error: 'Selecione o PDF do Agenda Serviço.' },
        { status: 400 },
      )
    }
    const leitura = await lerRelatorioAgendaPdf(arquivo)
    return NextResponse.json({ leitura })
  } catch (erro) {
    const mensagem = erro instanceof Error
      ? erro.message
      : 'Não foi possível ler o relatório.'
    return NextResponse.json({ error: mensagem }, { status: 400 })
  }
}
