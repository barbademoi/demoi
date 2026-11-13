import { exigirDono } from '@/lib/tarefix/dono'
import { Titulo } from '@/components/tarefix/ui'
import { BotaoSair } from '@/components/tarefix/BotaoSair'
import { FormEmpresa } from './FormEmpresa'
import { FormBonus } from './FormBonus'
import { SeletorTema } from '@/components/tarefix/Tema'
import { FormPush } from './FormPush'
import { TIPOS_PUSH, tiposLigados } from '@/lib/tarefix/push'
import { niveisOrdenados } from '@/lib/tarefix/bonus'
import { ehAdmin } from '@/lib/tarefix/acessos'
import Link from 'next/link'
import { TrocarSenha } from './TrocarSenha'

export const metadata = { title: 'Ajustes' }

export default async function Configuracoes() {
  const { db, empresa, dono, userId } = await exigirDono()
  const admin = await ehAdmin(userId)
  const { data: bonus } = await db.from('bonus_config').select('*').maybeSingle()
  return (
    <div className="space-y-5">
      <Titulo>Ajustes</Titulo>
      <section className="tf-cartao p-5">
        <h2 className="mb-4 text-lg font-extrabold">Empresa</h2>
        <FormEmpresa empresa={empresa} />
      </section>
      <section className="tf-cartao p-5">
        <h2 className="mb-4 text-lg font-extrabold">Bônus</h2>
        <FormBonus ativo={bonus?.ativo ?? false} mostrar={bonus?.mostrar_para_colaborador ?? true} niveis={niveisOrdenados(bonus?.niveis)} />
      </section>
      <section className="tf-cartao p-5">
        <h2 className="mb-4 text-lg font-extrabold">Notificações no celular</h2>
        <FormPush tipos={tiposLigados(empresa.push_tipos)} lista={TIPOS_PUSH} />
      </section>
      <section className="tf-cartao space-y-3 p-5">
        <h2 className="text-lg font-extrabold">Aparência</h2>
        <p className="text-sm text-tf-suave">Vale para este aparelho. &quot;Sistema&quot; segue o modo claro/escuro do celular ou computador.</p>
        <SeletorTema />
      </section>
      {admin && (
        <section className="tf-cartao space-y-3 p-5">
          <h2 className="text-lg font-extrabold">Mentorados</h2>
          <p className="text-sm text-tf-suave">Libere o Tarefix para um mentorado: ele ganha a própria empresa, separada da sua.</p>
          <Link href="/tarefix/painel/acessos" className="tf-botao w-full">
            Conceder acesso
          </Link>
        </section>
      )}
      <section className="tf-cartao space-y-3 p-5">
        <h2 className="text-lg font-extrabold">Conta</h2>
        <p className="text-tf-suave">
          {dono.nome} · {dono.email}
        </p>
        <p className="text-sm text-tf-suave">É a mesma conta do BarberMeta: sair aqui sai dos dois.</p>
        <TrocarSenha />
        <BotaoSair className="tf-botao2 w-full" />
      </section>
    </div>
  )
}
