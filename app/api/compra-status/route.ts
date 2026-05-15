import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref')
  if (!ref) return NextResponse.json({ status: 'invalid' }, { status: 400 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('compras_pendentes')
    .select('status')
    .eq('id', ref)
    .maybeSingle()

  return NextResponse.json({ status: data?.status ?? 'not_found' })
}
