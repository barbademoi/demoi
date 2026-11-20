import { manifesto, respostaManifesto } from '@/lib/tarefix/manifesto'

// perto do banco (Supabase em us-west-2), como o resto do Tarefix
export const preferredRegion = 'pdx1'

// Manifesto do painel do dono.
export function GET() {
  return respostaManifesto(manifesto({ nome: 'Tarefix — Painel', nomeCurto: 'Tarefix', inicio: '/tarefix/painel' }))
}
