import { manifesto, respostaManifesto } from '@/lib/tarefix/manifesto'

// Manifesto do mentorado: o ícone na tela inicial abre direto no link dele.
export function GET(_: Request, { params }: { params: { token: string } }) {
  if (!/^[a-f0-9]{32,128}$/i.test(params.token)) return new Response('Not found', { status: 404 })
  return respostaManifesto(manifesto({ nome: 'Tarefix — Mentoria', nomeCurto: 'Mentoria', inicio: `/tarefix/m/${params.token}` }))
}
