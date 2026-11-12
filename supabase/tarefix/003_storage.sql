-- =====================================================================
-- TAREFIX — 003 · Storage
--  tarefix-provas  (PRIVADO): fotos das tarefas e extras.
--          caminho: {empresa_id}/{colaborador_id}/{AAAA-MM-DD}/{arquivo}.jpg
--          Upload do colaborador é feito pelo servidor (service role).
--          Dono só LÊ (via signed URL) o que é da própria empresa.
--  tarefix-midia   (PÚBLICO): logo da empresa e fotos de perfil dos colaboradores.
--          caminho: {empresa_id}/...
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('tarefix-provas', 'tarefix-provas', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('tarefix-midia',  'tarefix-midia',  true,  5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

-- tarefix-provas: dono lê (necessário para gerar signed URL com a sessão dele)
create policy tarefix_provas_dono_select on storage.objects for select to authenticated
  using (
    bucket_id = 'tarefix-provas'
    and (storage.foldername(name))[1] = tarefix.minha_empresa()::text
  );

-- tarefix-midia: dono envia/troca/apaga dentro da pasta da própria empresa
create policy tarefix_midia_dono_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'tarefix-midia'
    and (storage.foldername(name))[1] = tarefix.minha_empresa()::text
  );
create policy tarefix_midia_dono_update on storage.objects for update to authenticated
  using (
    bucket_id = 'tarefix-midia'
    and (storage.foldername(name))[1] = tarefix.minha_empresa()::text
  );
create policy tarefix_midia_dono_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'tarefix-midia'
    and (storage.foldername(name))[1] = tarefix.minha_empresa()::text
  );
