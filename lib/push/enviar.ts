/**
 * ENTREGA DAS NOTIFICAÇÕES — Web Push com VAPID.
 *
 * Sem serviço de terceiro: o próprio servidor assina e entrega direto no push
 * service do navegador (Google, Mozilla, Apple). Não custa nada, não depende
 * de SDK e o dado não passa por ninguém.
 *
 * ── A ORDEM IMPORTA: GRAVA, DEPOIS ENVIA ────────────────────────────────────
 * O registro em `push_enviadas` acontece ANTES do envio, e o `unique (destino,
 * marco)` é o cadeado: se a linha já existe, outra execução do cron já cuidou
 * disso e esta desiste sem mandar nada. Gravar depois abriria a janela em que
 * duas execuções simultâneas mandam o mesmo aviso duas vezes — e "o sistema me
 * notificou duas vezes" é o tipo de defeito que faz a pessoa desligar tudo.
 *
 * O preço é o contrário: se o envio falhar DEPOIS de gravado, o aviso se
 * perde. Por isso a linha é apagada quando nenhum aparelho recebeu — aí a
 * execução seguinte tenta de novo.
 *
 * ── INSCRIÇÃO MORTA SE APAGA SOZINHA ────────────────────────────────────────
 * 404 e 410 do push service significam "este endereço não existe mais"
 * (desinstalou, limpou os dados, revogou). A linha vai embora na hora. Outros
 * erros contam como falha, e no teto a inscrição também sai: insistir num
 * endereço morto gasta o tempo do cron de todo mundo.
 */

// Import NOMEADO, e não default: `web-push` é CommonJS e não expõe default
// na interoperabilidade do Next — `import webpush from` compila e quebra em
// produção, no primeiro envio.
import { setVapidDetails, sendNotification } from 'web-push'
import type { Mensagem } from './mensagens'

/** Falhas seguidas antes de desistir de um aparelho. */
const MAX_FALHAS = 5

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any

export interface Inscricao {
  id: string
  endpoint: string
  p256dh: string
  auth: string
  falhas: number
}

let configurado = false

/**
 * Liga o VAPID a partir das variáveis de ambiente.
 *
 * Devolve false quando as chaves não existem — e aí NADA é enviado, em
 * silêncio. É o estado do sistema entre o deploy do código e a hora em que as
 * chaves entram no Vercel; derrubar o cron por isso não ajudaria ninguém.
 */
export function pushConfigurado(): boolean {
  if (configurado) return true
  const publica = process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privada = process.env.VAPID_PRIVATE_KEY
  if (!publica || !privada) return false

  // O "subject" é o contato que o push service usa pra reclamar com a gente
  // se o remetente se comportar mal. Precisa ser mailto: ou https:.
  const contato = process.env.VAPID_SUBJECT ?? 'mailto:barbeariademoi@gmail.com'
  setVapidDetails(contato, publica, privada)
  configurado = true
  return true
}

export interface ResultadoEnvio {
  entregues: number
  removidas: number
  falhas: number
}

/**
 * Manda uma mensagem pra TODOS os aparelhos de um destinatário.
 *
 * A pessoa pode ter celular e computador inscritos; os dois recebem, e a `tag`
 * da mensagem faz o aparelho substituir o aviso anterior do mesmo assunto em
 * vez de empilhar.
 */
export async function enviarPara(
  admin: Admin,
  inscricoes: Inscricao[],
  mensagem: Mensagem,
): Promise<ResultadoEnvio> {
  if (!pushConfigurado() || inscricoes.length === 0) {
    return { entregues: 0, removidas: 0, falhas: 0 }
  }

  const carga = JSON.stringify({
    titulo: mensagem.titulo,
    corpo: mensagem.corpo,
    url: mensagem.url,
    tag: mensagem.tag,
  })

  let entregues = 0
  let removidas = 0
  let falhas = 0

  await Promise.all(inscricoes.map(async (ins) => {
    try {
      await sendNotification(
        { endpoint: ins.endpoint, keys: { p256dh: ins.p256dh, auth: ins.auth } },
        carga,
        // TTL de 6 horas: um lembrete das 18h entregue às 3 da manhã não é
        // lembrete, é incômodo. Se o aparelho ficou offline a noite toda, que
        // o aviso morra — amanhã sai um novo, com o texto da hora certa.
        { TTL: 6 * 60 * 60 },
      )
      entregues++
      await admin.from('push_inscricoes')
        .update({ ultimo_envio: new Date().toISOString(), falhas: 0 })
        .eq('id', ins.id)
    } catch (err) {
      const status = (err as { statusCode?: number })?.statusCode

      // Endereço que não existe mais: fora, sem contemplação.
      if (status === 404 || status === 410) {
        await admin.from('push_inscricoes').delete().eq('id', ins.id)
        removidas++
        return
      }

      falhas++
      const novas = (ins.falhas ?? 0) + 1
      if (novas >= MAX_FALHAS) {
        await admin.from('push_inscricoes').delete().eq('id', ins.id)
        removidas++
      } else {
        await admin.from('push_inscricoes').update({ falhas: novas }).eq('id', ins.id)
      }
      console.error('[push] falha ao entregar:', status ?? err, ins.endpoint.slice(0, 48))
    }
  }))

  return { entregues, removidas, falhas }
}

/**
 * Tenta tomar posse de um envio.
 *
 * true = esta execução é a dona e deve mandar. false = já foi mandado (ou
 * outra execução pegou primeiro) e esta deve passar adiante, sem mandar nada.
 */
export async function reservarEnvio(
  admin: Admin,
  barbeariaId: string | null,
  destino: string,
  tipo: string,
  marco: string,
): Promise<boolean> {
  const { error } = await admin.from('push_enviadas').insert({
    barbearia_id: barbeariaId, destino, tipo, marco,
  })
  if (!error) return true

  // 23505 = unique_violation: já existe, então já foi.
  if ((error as { code?: string }).code === '23505') return false

  // Qualquer outro erro: NÃO manda. Sem o registro, o aviso sairia de novo na
  // hora seguinte, e de novo na outra — a repetição é pior que a ausência.
  console.error('[push] não deu pra reservar o envio:', error, tipo, marco)
  return false
}

/** Devolve a reserva quando nenhum aparelho recebeu, pra tentar de novo. */
export async function devolverReserva(
  admin: Admin,
  destino: string,
  marco: string,
): Promise<void> {
  const { error } = await admin.from('push_enviadas')
    .delete().eq('destino', destino).eq('marco', marco)
  if (error) console.error('[push] não deu pra devolver a reserva:', error, marco)
}

/** As inscrições de um conjunto de destinos, agrupadas por destino. */
export async function inscricoesPorDestino(
  admin: Admin,
  barbeariaIds: string[],
): Promise<Map<string, Inscricao[]>> {
  const mapa = new Map<string, Inscricao[]>()
  if (barbeariaIds.length === 0) return mapa

  const { data, error } = await admin
    .from('push_inscricoes')
    .select('id, endpoint, p256dh, auth, falhas, usuario_id, barbeiro_id')
    .in('barbearia_id', barbeariaIds)

  if (error) {
    console.error('[push] não deu pra ler as inscrições:', error)
    return mapa
  }

  type Linha = Inscricao & { usuario_id: string | null; barbeiro_id: string | null }
  for (const l of (data ?? []) as Linha[]) {
    const destino = l.usuario_id ? `dono:${l.usuario_id}` : `barbeiro:${l.barbeiro_id}`
    const lista = mapa.get(destino) ?? []
    lista.push({ id: l.id, endpoint: l.endpoint, p256dh: l.p256dh, auth: l.auth, falhas: l.falhas })
    mapa.set(destino, lista)
  }
  return mapa
}
