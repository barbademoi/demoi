-- Bússola — Storage de fotos de profissionais (Prompt 2)
-- Rodar no SQL Editor do Supabase.

-- Bucket público, 2MB, só imagens.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profissionais-fotos',
  'profissionais-fotos',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Leitura pública (qualquer um vê a foto pela URL).
create policy "fotos profissionais: leitura publica"
  on storage.objects for select
  using (bucket_id = 'profissionais-fotos');

-- Upload/edição/remoção só pra usuário autenticado (o dono logado).
create policy "fotos profissionais: upload autenticado"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'profissionais-fotos');

create policy "fotos profissionais: update autenticado"
  on storage.objects for update to authenticated
  using (bucket_id = 'profissionais-fotos');

create policy "fotos profissionais: delete autenticado"
  on storage.objects for delete to authenticated
  using (bucket_id = 'profissionais-fotos');
