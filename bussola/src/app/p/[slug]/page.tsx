import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function PlacarPublicoPage({ params }: { params: { slug: string } }) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('profissionais')
    .select('nome, status')
    .eq('slug', params.slug)
    .maybeSingle()

  // Link só funciona pra quem não foi desligado (e cujo slug existe).
  const valido = data && data.status !== 'desligado'

  if (!valido) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-primary mb-2">Bússola</h1>
          <p className="text-text font-medium mt-6">Link inválido ou expirado</p>
          <p className="text-text-muted text-sm mt-1">
            Este link não está mais disponível. Fale com o responsável pelo seu estabelecimento.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm text-center animate-fade-in">
        <h1 className="text-2xl font-bold text-primary mb-2">Bússola</h1>
        <p className="text-lg text-text font-medium mt-8">Olá, {data!.nome}! 👋</p>
        <p className="text-text-muted mt-2">
          Em breve o placar e elogios estarão disponíveis aqui.
        </p>
      </div>
    </main>
  )
}
