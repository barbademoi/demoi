import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { avisosDoDono, avisosDoBarbeiro, limitarPorDestino, type Aviso } from '@/lib/push/regras'
import { agoraSaoPaulo, carregarEstado } from '@/lib/push/estadoServidor'
import { enriquecerComResumo } from '@/lib/push/resumoServidor'
import { configPush, segredoCron } from '@/lib/push/config'
import {
  enviarPara, inscricoesPorDestino, reservarEnvio, devolverReserva,
} from '@/lib/push/enviar'

/**
 * O AGENDADOR DAS NOTIFICAÇÕES.
 *
 * Roda de hora em hora e reavalia tudo do zero: quem está inscrito, o que já
 * foi feito hoje, o que cada regra manda enviar agora. Não guarda estado entre
 * execuções, não tem fila. Se uma execução falhar, a próxima resolve; se rodar
 * duas vezes na mesma hora, nada sai dobrado — `push_enviadas` é o cadeado.
 *
 * ── QUEM CHAMA ──────────────────────────────────────────────────────────────
 * O pg_cron do próprio Supabase, nove vezes por dia, mandando o segredo de
 * `push_config` no cabeçalho `x-barbermeta-cron` (migration 063). É o mesmo
 * arranjo do Tarefix neste projeto, e foi escolhido por um motivo prático: não
 * exige variável na Vercel, secret no GitHub nem plano pago — o agendamento
 * nasce junto com a migration.
 *
 * O `Authorization: Bearer <CRON_SECRET>` continua aceito, pra não quebrar
 * nenhum chamador antigo que ainda exista.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Comparação em tempo constante — comparar segredo com `===` vaza o prefixo. */
function iguais(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export async function GET(request: Request) {
  const admin = createAdminClient()

  // ── Primeiro quem é, depois qualquer outra coisa ──
  // O segredo é lido sozinho, numa consulta barata: `configPush` cria o par
  // VAPID quando ainda não existe, e isso não pode acontecer por causa de uma
  // requisição que nem é do agendador.
  const doBanco = request.headers.get('x-barbermeta-cron') ?? ''
  const auth = request.headers.get('authorization') ?? ''
  const segredoEnv = process.env.CRON_SECRET

  let autorizado = !!segredoEnv && auth !== '' && iguais(auth, `Bearer ${segredoEnv}`)
  if (!autorizado && doBanco !== '') {
    const segredo = await segredoCron(admin)
    autorizado = !!segredo && iguais(doBanco, segredo)
  }
  if (!autorizado) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Agora sim: as chaves pra assinar o envio.
  const cfg = await configPush(admin)
  if (!cfg) {
    return NextResponse.json(
      { error: 'push_config indisponível — rode a migration 063' },
      { status: 503 },
    )
  }

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

    const r = await enviarPara(admin, aparelhos, aviso.mensagem, cfg)
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
