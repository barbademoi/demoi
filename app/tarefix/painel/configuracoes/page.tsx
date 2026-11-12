import { exigirDono } from '@/lib/tarefix/dono'
import { Titulo } from '@/components/tarefix/ui'
import { BotaoSair } from '@/components/tarefix/BotaoSair'
import { FormEmpresa } from './FormEmpresa'

export const metadata = { title: 'Ajustes' }

export default async function Configuracoes() {
  const { empresa, dono } = await exigirDono()
  return (
    <div className="space-y-5">
      <Titulo>Ajustes</Titulo>
      <section className="tf-cartao p-5">
        <h2 className="mb-4 text-lg font-extrabold">Empresa</h2>
        <FormEmpresa empresa={empresa} />
      </section>
      <section className="tf-cartao space-y-3 p-5">
        <h2 className="text-lg font-extrabold">Conta</h2>
        <p className="text-tf-suave">
          {dono.nome} · {dono.email}
        </p>
        <p className="text-sm text-tf-suave">É a mesma conta do BarberMeta: sair aqui sai dos dois.</p>
        <BotaoSair className="tf-botao2 w-full" />
      </section>
      <p className="text-sm text-tf-suave">Bônus e tema claro/escuro chegam nas próximas etapas.</p>
    </div>
  )
}
