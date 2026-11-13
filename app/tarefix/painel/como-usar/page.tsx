import { exigirDono } from '@/lib/tarefix/dono'
import { ehAdmin } from '@/lib/tarefix/acessos'
import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { horarioCurto } from '@/lib/tarefix/datas'
import { GuiaDono, type ItemProgresso } from './GuiaDono'

export const metadata = { title: 'Como usar' }

export default async function ComoUsar() {
  const { db, empresa, userId } = await exigirDono()
  const [funcoes, colaboradores, modelos, feitas, bonus, push, admin] = await Promise.all([
    db.from('funcoes').select('*', { count: 'exact', head: true }),
    db.from('colaboradores').select('*', { count: 'exact', head: true }).eq('ativo', true),
    db.from('tarefas_modelo').select('*', { count: 'exact', head: true }).eq('ativo', true),
    db.from('tarefas_dia').select('*', { count: 'exact', head: true }).eq('status', 'feita'),
    db.from('bonus_config').select('ativo').maybeSingle(),
    createTarefixAdmin().from('push_inscricoes').select('*', { count: 'exact', head: true }).eq('empresa_id', empresa.id).not('dono_id', 'is', null),
    ehAdmin(userId),
  ])
  const fecha = horarioCurto(empresa.horario_fechamento)

  const progresso: ItemProgresso[] = [
    { feito: (funcoes.count ?? 0) > 0, titulo: 'Criar as funções', href: '/tarefix/painel/funcoes' },
    { feito: (colaboradores.count ?? 0) > 0, titulo: 'Cadastrar a equipe', href: '/tarefix/painel/colaboradores' },
    { feito: (modelos.count ?? 0) > 0, titulo: 'Montar as tarefas', href: '/tarefix/painel/tarefas' },
    { feito: (feitas.count ?? 0) > 0, titulo: 'Equipe dar o primeiro check', href: '/tarefix/painel/colaboradores' },
    { feito: Boolean(bonus.data?.ativo), titulo: 'Configurar o bônus (opcional)', href: '/tarefix/painel/configuracoes' },
    { feito: (push.count ?? 0) > 0, titulo: 'Ligar as notificações no seu celular', href: '/tarefix/painel/configuracoes' },
  ]
  return <GuiaDono progresso={progresso} fecha={fecha} admin={admin} />
}
