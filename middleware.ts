import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Sem as variáveis de ambiente o middleware não pode checar sessão —
  // libera a requisição para o servidor tratar o auth.
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

  const { pathname } = request.nextUrl

  try {
    const { data: { session } } = await supabase.auth.getSession()

    const isAuthRoute     = pathname === '/login'
    const isBarbeiroRoute = pathname.startsWith('/b/')
    const isApiRoute      = pathname.startsWith('/api/')
    const isAuthCallback  = pathname.startsWith('/auth/')
    const isPasswordRoute = pathname === '/esqueci-senha' || pathname === '/redefinir-senha'
    const isPublicRoute   = isAuthRoute || isBarbeiroRoute || isApiRoute ||
                            isAuthCallback || isPasswordRoute

    if (!session && !isPublicRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (session && isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch (err) {
    console.error('[middleware] erro ao verificar sessão:', err)
    const isPublicRoute = pathname === '/login' ||
                          pathname.startsWith('/b/') ||
                          pathname.startsWith('/api/') ||
                          pathname.startsWith('/auth/') ||
                          pathname === '/esqueci-senha' ||
                          pathname === '/redefinir-senha'
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon\\.svg|.*\\.(?:png|svg|ico)$).*)',
  ],
}
