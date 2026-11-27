import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Renova a sessão do Supabase nas áreas logadas. Páginas públicas (lista de
 * espera, vendas) nem chegam aqui — ver `config.matcher` — então o Auth fora
 * do ar nunca derruba a captação. Quem decide o acesso de verdade é cada
 * página (requireAdmin / requireMembro) e o RLS no banco.
 */
const PRAZO_MS = 5000

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const { data } = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, rej) => {
        timer = setTimeout(() => rej(new Error('Auth não respondeu')), PRAZO_MS)
      }),
    ])
    if (!data.user) {
      const login = new URL('/entrar', request.url)
      login.searchParams.set('next', request.nextUrl.pathname)
      return NextResponse.redirect(login)
    }
  } catch (e) {
    console.error('[middleware]', e)
    return NextResponse.redirect(new URL('/entrar', request.url))
  } finally {
    if (timer) clearTimeout(timer)
  }
  return response
}

export const config = {
  matcher: ['/admin/:path*', '/app/:path*', '/inicio', '/comprar/pagamento', '/aguardando', '/renovar'],
}
