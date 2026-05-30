-- Bússola — AJUSTE H Parte 2: logo da empresa
-- Não destrutivo. Adiciona coluna + bucket de storage com RLS.

alter table estabelecimentos
  add column if not exists logo_url text;

-- Bucket público pra leitura (necessário pra exibir nas telas /p/[slug] e /c/[slug]).
insert into storage.buckets (id, name, public)
values ('empresas-logos', 'empresas-logos', true)
on conflict (id) do nothing;

-- Leitura pública: qualquer um pode ver as logos.
drop policy if exists "logos sao publicas" on storage.objects;
create policy "logos sao publicas"
  on storage.objects for select
  using (bucket_id = 'empresas-logos');

-- Upload/update/delete: só o dono da empresa correspondente.
-- Path esperado: empresas-logos/{estabelecimento_id}/logo.png
drop policy if exists "dono gerencia logo da sua empresa" on storage.objects;
create policy "dono gerencia logo da sua empresa"
  on storage.objects for all
  using (
    bucket_id = 'empresas-logos'
    and (storage.foldername(name))[1] in (
      select id::text from estabelecimentos where dono_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'empresas-logos'
    and (storage.foldername(name))[1] in (
      select id::text from estabelecimentos where dono_id = auth.uid()
    )
  );
