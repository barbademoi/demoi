import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Logout: encerra a sessão e volta pra tela de entrada.
export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  try {
    const supabase = createClient()
    await supabase.auth.signOut()
  } catch (err) {
    console.error('[sair] erro ao encerrar sessão:', err)
  }
  return NextResponse.redirect(`${origin}/entrar`, { status: 303 })
}
