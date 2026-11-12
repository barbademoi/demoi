import { manifesto, respostaManifesto } from '@/lib/tarefix/manifesto'

// Manifesto do painel do dono.
export function GET() {
  return respostaManifesto(manifesto({ nome: 'Tarefix — Painel', nomeCurto: 'Tarefix', inicio: '/tarefix/painel' }))
}
