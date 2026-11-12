import { manifesto, respostaManifesto } from '@/lib/tarefix/manifesto'

// Manifesto do colaborador: o ícone na tela inicial abre direto no link dele.
// Não consulta o banco (o token já está na URL de quem pede).
export function GET(_: Request, { params }: { params: { token: string } }) {
  if (!/^[a-f0-9]{32,128}$/i.test(params.token)) return new Response('Not found', { status: 404 })
  return respostaManifesto(manifesto({ nome: 'Tarefix — Minhas tarefas', nomeCurto: 'Tarefix', inicio: `/tarefix/c/${params.token}` }))
}
