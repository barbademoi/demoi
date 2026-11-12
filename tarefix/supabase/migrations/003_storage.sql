-- =====================================================================
-- TAREFIX — 003 · Storage
--  provas  (PRIVADO): fotos das tarefas e extras.
--          caminho: {empresa_id}/{colaborador_id}/{AAAA-MM-DD}/{arquivo}.jpg
--          Upload do colaborador é feito pelo servidor (service role).
--          Dono só LÊ (via signed URL) o que é da própria empresa.
--  midia   (PÚBLICO): logo da empresa e fotos de perfil dos colaboradores.
--          caminho: {empresa_id}/...
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('provas', 'provas', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('midia',  'midia',  true,  5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

-- provas: dono lê (necessário para gerar signed URL com a sessão dele)
create policy provas_dono_select on storage.objects for select to authenticated
  using (
    bucket_id = 'provas'
    and (storage.foldername(name))[1] = public.minha_empresa()::text
  );

-- midia: dono envia/troca/apaga dentro da pasta da própria empresa
create policy midia_dono_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'midia'
    and (storage.foldername(name))[1] = public.minha_empresa()::text
  );
create policy midia_dono_update on storage.objects for update to authenticated
  using (
    bucket_id = 'midia'
    and (storage.foldername(name))[1] = public.minha_empresa()::text
  );
create policy midia_dono_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'midia'
    and (storage.foldername(name))[1] = public.minha_empresa()::text
  );
