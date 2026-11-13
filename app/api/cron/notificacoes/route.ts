import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { avisosDoDono, avisosDoBarbeiro, limitarPorDestino, type Aviso } from '@/lib/push/regras'
import { agoraSaoPaulo, carregarEstado } from '@/lib/push/estadoServidor'
import { enriquecerComResumo } from '@/lib/push/resumoServidor'
import {
  enviarPara, inscricoesPorDestino, reservarEnvio, devolverReserva, pushConfigurado,
} from '@/lib/push/enviar'

/**
 * O AGENDADOR DAS NOTIFICAÇÕES.
 *
 * Roda de hora em hora e reavalia tudo do zero: quem está inscrito, o que já
 * foi feito hoje, o que cada regra manda enviar agora. Não guarda estado entre
 * execuções, não tem fila. Se uma execução falhar, a próxima resolve; se rodar
 * duas vezes na mesma hora, nada sai dobrado — `push_enviadas` é o cadeado.
 *
 * Protegido por CRON_SECRET, igual ao cron do brinde mínimo.
 *
 * ── QUEM CHAMA ──────────────────────────────────────────────────────────────
 * O plano Hobby da Vercel só permite cron 1×/dia, e os lembretes precisam de
 * seis disparos (18h às 23h). Então quem chama de hora em hora é um workflow
 * do GitHub Actions (`.github/workflows/notificacoes.yml`), que é grátis e
 * não depende do plano. Virando Pro, é só mover o agendamento pro
 * `vercel.json` e apagar o workflow — esta rota não muda.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Sem as chaves VAPID não há o que entregar. Responde 200 pra o agendador
  // não ficar marcando falha durante a janela entre o deploy e as chaves.
  if (!pushConfigurado()) {
    return NextResponse.json({ ok: true, pulado: 'VAPID não configurado' })
  }

  const admin = createAdminClient()
  const agora = agoraSaoPaulo()

  // ── Quem tem aparelho inscrito ──
  const { data: inscritosRaw, error: errIns } = await admin
    .from('push_inscricoes').select('barbearia_id, usuario_id, barbeiro_id')
  if (errIns) {
    console.error('[push] não deu pra ler as inscrições:', errIns)
    return NextResponse.json({ error: 'Erro ao ler inscrições' }, { status: 500 })
  }

  type Ins = { barbearia_id: string; usuario_id: string | null; barbeiro_id: string | null }
  const inscritos = (inscritosRaw ?? []) as Ins[]
  if (inscritos.length === 0) {
    return NextResponse.json({ ok: true, hora: agora.hora, inscritos: 0, enviados: 0 })
  }

  const destinos = Array.from(new Set(inscritos.map((i) =>
    i.usuario_id ? `dono:${i.usuario_id}` : `barbeiro:${i.barbeiro_id}`)))

  // ── O estado de agora, e os números caros só quando a hora pede ──
  const barbearias = await carregarEstado(admin, destinos, agora)
  await enriquecerComResumo(admin, barbearias, agora)

  // ── O que as regras mandam enviar ──
  let avisos: Aviso[] = []
  const barbeariaDoDestino = new Map<string, string>()
  for (const b of barbearias) {
    if (b.dono) {
      barbeariaDoDestino.set(b.dono.destino, b.id)
      avisos = avisos.concat(avisosDoDono(b.dono, agora))
    }
    for (const bb of b.barbeiros) {
      barbeariaDoDestino.set(bb.destino, b.id)
      avisos = avisos.concat(avisosDoBarbeiro(bb, agora))
    }
  }
  avisos = limitarPorDestino(avisos)

  if (avisos.length === 0) {
    return NextResponse.json({ ok: true, hora: agora.hora, inscritos: destinos.length, enviados: 0 })
  }

  // ── Entrega ──
  const porDestino = await inscricoesPorDestino(admin, Array.from(new Set(barbearias.map((b) => b.id))))

  let enviados = 0
  let pulados = 0
  let semAparelho = 0

  for (const aviso of avisos) {
    const aparelhos = porDestino.get(aviso.destino) ?? []
    if (aparelhos.length === 0) { semAparelho++; continue }

    const barbeariaId = barbeariaDoDestino.get(aviso.destino) ?? null
    // Reserva ANTES de mandar: o unique é o que impede o aviso duplicado.
    const minha = await reservarEnvio(admin, barbeariaId, aviso.destino, aviso.tipo, aviso.marco)
    if (!minha) { pulados++; continue }

    const r = await enviarPara(admin, aparelhos, aviso.mensagem)
    if (r.entregues > 0) {
      enviados++
    } else {
      // Ninguém recebeu: devolve a reserva pra a execução seguinte tentar.
      await devolverReserva(admin, aviso.destino, aviso.marco)
    }
  }

  // Faxina do diário, uma vez por dia, na primeira execução da madrugada.
  if (agora.hora === 3) {
    await admin.rpc('push_limpar_historico').then(
      () => {},
      (e: unknown) => console.error('[push] faxina falhou:', e),
    )
  }

  return NextResponse.json({
    ok: true,
    hora: agora.hora,
    inscritos: destinos.length,
    avaliados: avisos.length,
    enviados,
    pulados,
    semAparelho,
  })
}
