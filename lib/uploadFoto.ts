import { createClient } from '@/lib/supabase/client'

export async function uploadFoto(file: File, pasta: string): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${pasta}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('fotos')
    .upload(path, file, { upsert: true })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('fotos').getPublicUrl(path)
  return data.publicUrl
}
