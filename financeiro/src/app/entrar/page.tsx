import { EntrarForm } from './EntrarForm'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Entrar' }

interface Props {
  searchParams: { msg?: string }
}

export default function EntrarPage({ searchParams }: Props) {
  return <EntrarForm msg={searchParams.msg} />
}
