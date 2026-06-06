import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rotas que exigem sessão iniciada.
const ROTAS_PROTEGIDAS = ['/painel', '/onboarding']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Sem env configurada não há como validar sessão — deixa passar.
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const protegida = ROTAS_PROTEGIDAS.some((rota) => pathname.startsWith(rota))
  const TROCAR_SENHA = '/trocar-senha-obrigatorio'

  // Sem sessão em rota protegida → manda para /entrar.
  if (!user && protegida) {
    return NextResponse.redirect(new URL('/entrar', request.url))
  }

  // Logado mas sem senha definida (cliente Hotmart usando senha temp):
  // força ir pra /trocar-senha-obrigatorio antes de qualquer outra coisa.
  if (user) {
    const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>
    const senhaDefinida = appMeta.senha_definida !== false // padrão: true (usuários antigos não têm a flag)

    if (
      !senhaDefinida &&
      pathname !== TROCAR_SENHA &&
      !pathname.startsWith('/api/auth/')
    ) {
      return NextResponse.redirect(new URL(TROCAR_SENHA, request.url))
    }

    // Se já trocou e tenta voltar pra essa página, manda pro painel
    if (senhaDefinida && pathname === TROCAR_SENHA) {
      return NextResponse.redirect(new URL('/painel', request.url))
    }
  }

  // Já logado tentando ver telas de auth → manda para o painel.
  // Exceção: se ainda não definiu senha, deixa o fluxo de trocar-senha cuidar.
  if (user && (pathname === '/entrar' || pathname === '/cadastro')) {
    const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>
    if (appMeta.senha_definida !== false) {
      return NextResponse.redirect(new URL('/painel', request.url))
    }
  }

  return supabaseResponse
}
