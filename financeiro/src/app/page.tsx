import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

// Raiz: logado vai pro app; visitante vai pra página de oferta.
export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  redirect(user ? '/app' : '/oferta')
}
