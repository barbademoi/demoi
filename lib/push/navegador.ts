'use client'

/**
 * O LADO DO NAVEGADOR: registrar o service worker e criar a inscrição.
 *
 * Lógica pura de browser, sem React — a tela só chama e mostra o resultado.
 *
 * ── O IPHONE É O CASO DIFÍCIL ───────────────────────────────────────────────
 * No Android e no computador basta aceitar a permissão. No iOS, a Apple só
 * entrega push pra site ADICIONADO À TELA DE INÍCIO: no Safari comum, a API
 * `PushManager` nem existe, e pedir permissão lança erro. Por isso o
 * diagnóstico aqui separa "não dá" de "dá, mas antes instale" — são conversas
 * diferentes com a pessoa, e tratar as duas como "seu navegador não suporta"
 * faria o dono desistir de uma coisa que funcionaria em dois toques.
 */

export type EstadoPush =
  /** Dá pra ativar agora. */
  | 'pode-ativar'
  /** Já está ativo neste aparelho. */
  | 'ativo'
  /** A pessoa bloqueou. Só volta pelas configurações do navegador. */
  | 'bloqueado'
  /** iOS no Safari comum: precisa adicionar à tela de início antes. */
  | 'precisa-instalar'
  /** Navegador sem suporte (ou contexto não seguro). */
  | 'sem-suporte'

/** É um aparelho da Apple? (iPhone, iPad — inclusive o iPad que se diz Mac.) */
export function ehIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua)
    || (/Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document)
}

/** Está aberto como app (tela de início), e não como aba do navegador? */
export function abertoComoApp(): boolean {
  if (typeof window === 'undefined') return false
  const comoApp = window.matchMedia?.('(display-mode: standalone)').matches
  // `navigator.standalone` é o jeito antigo da Apple, e segue sendo o único
  // confiável no iOS.
  const apple = (window.navigator as { standalone?: boolean }).standalone
  return !!comoApp || apple === true
}

export async function estadoAtual(): Promise<EstadoPush> {
  if (typeof window === 'undefined') return 'sem-suporte'

  const temAPI = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  if (!temAPI) {
    // No iOS, a falta da API quase sempre é só o Safari comum — e aí a saída
    // existe: instalar. Dizer "sem suporte" seria mentira útil pra ninguém.
    return ehIOS() && !abertoComoApp() ? 'precisa-instalar' : 'sem-suporte'
  }

  if (Notification.permission === 'denied') return 'bloqueado'

  // iOS com a API presente mas ainda em aba: pedir permissão aqui falha.
  if (ehIOS() && !abertoComoApp()) return 'precisa-instalar'

  if (Notification.permission === 'granted') {
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      const ins = await reg?.pushManager.getSubscription()
      if (ins) return 'ativo'
    } catch {
      // Sem registro ainda: é o caso de quem concedeu permissão num aparelho e
      // abriu noutro. Segue pra 'pode-ativar'.
    }
  }
  return 'pode-ativar'
}

/** Chave pública VAPID em Uint8Array, como o PushManager exige. */
function chaveParaBytes(base64: string): Uint8Array {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/')
  const cru = window.atob(b64)
  const bytes = new Uint8Array(cru.length)
  for (let i = 0; i < cru.length; i++) bytes[i] = cru.charCodeAt(i)
  return bytes
}

export interface InscricaoCriada {
  endpoint: string
  p256dh: string
  auth: string
  userAgent: string
}

export type ResultadoAtivar =
  | { ok: true; inscricao: InscricaoCriada }
  | { ok: false; estado: EstadoPush; erro?: string }

/**
 * Pede a permissão e cria a inscrição.
 *
 * Tem de ser chamada a partir de um clique: navegador nenhum deixa pedir
 * permissão de notificação sem gesto do usuário — e o Chrome ainda penaliza
 * o site que tenta.
 */
export async function ativar(chavePublica: string): Promise<ResultadoAtivar> {
  const estado = await estadoAtual()
  if (estado === 'sem-suporte' || estado === 'precisa-instalar' || estado === 'bloqueado') {
    return { ok: false, estado }
  }
  if (!chavePublica) {
    return { ok: false, estado: 'sem-suporte', erro: 'Notificações ainda não configuradas no servidor.' }
  }

  try {
    const permissao = await Notification.requestPermission()
    if (permissao !== 'granted') {
      return { ok: false, estado: permissao === 'denied' ? 'bloqueado' : 'pode-ativar' }
    }

    const reg = await navigator.serviceWorker.register('/sw.js')
    // `ready` espera o worker assumir de fato: inscrever antes disso falha em
    // parte dos aparelhos, com um erro que não diz nada.
    await navigator.serviceWorker.ready

    const existente = await reg.pushManager.getSubscription()
    const inscricao = existente ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // O `lib.dom` tipa isso como BufferSource com ArrayBuffer estrito; o
      // Uint8Array que montamos é exatamente isso em tempo de execução.
      applicationServerKey: chaveParaBytes(chavePublica) as unknown as BufferSource,
    })

    const json = inscricao.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, estado: 'sem-suporte', erro: 'O navegador devolveu uma inscrição incompleta.' }
    }

    return {
      ok: true,
      inscricao: {
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        userAgent: navigator.userAgent,
      },
    }
  } catch (e) {
    console.error('[push] erro ao ativar:', e)
    return { ok: false, estado: 'pode-ativar', erro: 'Não deu pra ativar agora. Tente de novo.' }
  }
}

/** Cancela no navegador e devolve o endpoint, pra o servidor apagar a linha. */
export async function desativar(): Promise<string | null> {
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const ins = await reg?.pushManager.getSubscription()
    if (!ins) return null
    const endpoint = ins.endpoint
    await ins.unsubscribe()
    return endpoint
  } catch {
    return null
  }
}
