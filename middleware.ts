import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * O MIDDLEWARE — quem pode ver o quê, antes da página existir.
 *
 * ── POR QUE ELE FOI REESCRITO ───────────────────────────────────────────────
 * Em 24/11 o site inteiro respondeu `504 MIDDLEWARE_INVOCATION_TIMEOUT`. O
 * middleware tem uma única operação que espera resposta de fora —
 * `supabase.auth.getUser()`, uma ida de rede ao Auth — e ela ficou pendurada
 * até a Vercel matar a execução. Como o middleware roda ANTES de qualquer
 * página, nada carregou: nem a landing, nem o link do barbeiro, nem a roleta
 * do cliente. Páginas que não dependem de login nenhum caíram junto.
 *
 * Duas mudanças resolvem isso, e nenhuma delas mexe em quem pode ver o quê:
 *
 *   1. ROTA PÚBLICA NÃO FALA COM O AUTH. Antes, toda requisição buscava o
 *      usuário e, na maioria delas, jogava o resultado fora — o `user` só
 *      decide alguma coisa em rota privada e no /login. Agora a classificação
 *      da rota (comparação de string, sem rede) vem primeiro, e a ida ao Auth
 *      só acontece quando a resposta dela muda alguma decisão.
 *
 *   2. A CHAMADA QUE SOBRA TEM PRAZO. Se o Auth não responder em alguns
 *      segundos, o middleware desiste em vez de ficar pendurado. Desistir cai
 *      no mesmo tratamento que já existia para erro: rota privada manda pro
 *      /login. Sai um pedido de login indevido, o que é ruim — e ainda assim
 *      muito melhor que o site inteiro dar 504.
 *
 * O efeito colateral de (1): quem fica só em página pública não tem o token
 * renovado nesse meio tempo. Na prática não muda nada, porque a renovação
 * acontece no instante em que a pessoa abre qualquer página privada — e
 * /dashboard é privada.
 */

/** Quanto esperar pelo Auth antes de desistir. */
const PRAZO_AUTH_MS = 5000

export interface Rota {
  /** Não exige login. */
  publica: boolean
  /** É a tela de login. Pública, mas o usuário muda o que acontece nela. */
  login: boolean
  /** Faz parte do onboarding obrigatório. */
  onboarding: boolean
}

/**
 * Classifica o caminho. Função pura, sem rede — é ela que decide se vale a
 * pena falar com o Auth.
 *
 * Esta é a ÚNICA lista de rotas públicas do arquivo. Antes havia duas, uma no
 * caminho normal e outra dentro do `catch`, e manter as duas em dia era uma
 * questão de sorte: a hora em que divergissem, o erro seria alguém entrando
 * onde não devia, justamente quando o sistema já estava com problema.
 */
export function classificar(pathname: string): Rota {
  const login = pathname === '/login'

  const publica =
    login ||
    pathname === '/' ||
    pathname === '/oferta' ||
    pathname === '/boas-vindas' ||
    pathname === '/comprar' ||
    pathname === '/aguardando' ||
    // Link do barbeiro: sem conta e sem senha, é o token no endereço que vale.
    pathname.startsWith('/b/') ||
    // Avaliação do cliente.
    pathname.startsWith('/c/') ||
    // Roleta pública (o cliente escaneia o QR). NÃO cobre /dashboard/brindoleta
    // nem /admin/brindoleta — esses têm outro prefixo e seguem protegidos.
    pathname.startsWith('/brindoleta/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/') ||
    // `===` de propósito: /redefinir-senha-obrigatoria é PRIVADA, e um
    // startsWith aqui a abriria sem querer.
    pathname === '/esqueci-senha' ||
    pathname === '/redefinir-senha' ||
    // Tarefix: app separado dentro do mesmo site. Cuida do próprio acesso
    // (dono com login próprio; colaborador por link + PIN).
    pathname === '/tarefix' ||
    pathname.startsWith('/tarefix/')

  return { publica, login, onboarding: pathname.startsWith('/onboarding') }
}

/** Promessa com prazo. Estourou, rejeita — e o timer não fica vivo atrás. */
async function comPrazo<T>(promessa: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promessa,
      new Promise<never>((_, rejeitar) => {
        timer = setTimeout(() => rejeitar(new Error('o Auth não respondeu a tempo')), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const rota = classificar(pathname)

  // ── O atalho que mantém o site de pé ──
  // Em rota pública que não seja o /login, o usuário não altera decisão
  // nenhuma daqui pra baixo. Então não há motivo pra esperar o Auth: a página
  // segue direto, e uma indisponibilidade do Auth não derruba a landing, o
  // link do barbeiro, a roleta do cliente, o Tarefix nem as rotas de API.
  if (rota.publica && !rota.login) {
    return NextResponse.next()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options })
        response = NextResponse.next({ request: { headers: request.headers } })
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options })
        response = NextResponse.next({ request: { headers: request.headers } })
        response.cookies.set({ name, value: '', ...options })
      },
    },
  })

  try {
    const { data: { user } } = await comPrazo(supabase.auth.getUser(), PRAZO_AUTH_MS)

    if (!user && !rota.publica) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Conta criada só pelo Tarefix (cadastro do Tarefix ou mentorado com
    // e-mail novo) não tem acesso ao BarberMeta: volta para o Tarefix.
    if (user?.app_metadata?.tarefix_only === true && (!rota.publica || rota.login)) {
      return NextResponse.redirect(new URL('/tarefix', request.url))
    }
    if (user && rota.login) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Onboarding pelo cookie, sem consultar o banco.
    const precisaOnboarding = request.cookies.get('onboarding_required')?.value === '1'
    if (user && precisaOnboarding && !rota.onboarding && !rota.publica) {
      return NextResponse.redirect(new URL('/onboarding/passo-1', request.url))
    }
  } catch (err) {
    // Auth fora do ar, lento ou com erro. Sem saber quem é, o único caminho
    // seguro para rota privada é o /login — e a própria página confere a
    // sessão de novo, então a proteção não depende só daqui.
    console.error('[middleware] não deu pra verificar a sessão:', err)
    if (!rota.publica) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon\\.svg|.*\\.(?:png|jpe?g|webp|gif|svg|ico)$).*)',
  ],
}
