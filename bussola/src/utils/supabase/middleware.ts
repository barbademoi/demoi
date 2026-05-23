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

  // Sem sessão em rota protegida → manda para /entrar.
  if (!user && protegida) {
    return NextResponse.redirect(new URL('/entrar', request.url))
  }

  // Já logado tentando ver telas de auth → manda para o painel.
  if (user && (pathname === '/entrar' || pathname === '/cadastro')) {
    return NextResponse.redirect(new URL('/painel', request.url))
  }

  return supabaseResponse
}
