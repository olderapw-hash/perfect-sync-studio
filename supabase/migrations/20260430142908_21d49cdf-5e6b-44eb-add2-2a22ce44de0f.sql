
-- Bucket público para releases do installer
insert into storage.buckets (id, name, public)
values ('installer-releases', 'installer-releases', true)
on conflict (id) do update set public = true;

-- Leitura pública dos arquivos de release
create policy "installer-releases public read"
on storage.objects for select
to public
using (bucket_id = 'installer-releases');

-- Apenas superadmin pode escrever no bucket
create policy "installer-releases superadmin write"
on storage.objects for insert
to authenticated
with check (bucket_id = 'installer-releases' and public.has_role(auth.uid(), 'superadmin'::app_role));

create policy "installer-releases superadmin update"
on storage.objects for update
to authenticated
using (bucket_id = 'installer-releases' and public.has_role(auth.uid(), 'superadmin'::app_role))
with check (bucket_id = 'installer-releases' and public.has_role(auth.uid(), 'superadmin'::app_role));

create policy "installer-releases superadmin delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'installer-releases' and public.has_role(auth.uid(), 'superadmin'::app_role));

-- Tabela de releases
create table public.installer_releases (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  changelog text,
  file_url text not null,
  file_path text not null,
  file_size_bytes bigint,
  is_current boolean not null default false,
  published_at timestamptz not null default now(),
  published_by uuid not null
);

alter table public.installer_releases enable row level security;

-- Leitura pública (qualquer usuário logado ou anônimo pode ver releases)
create policy "installer_releases public read"
on public.installer_releases for select
to public
using (true);

create policy "installer_releases superadmin insert"
on public.installer_releases for insert
to authenticated
with check (public.has_role(auth.uid(), 'superadmin'::app_role) and published_by = auth.uid());

create policy "installer_releases superadmin update"
on public.installer_releases for update
to authenticated
using (public.has_role(auth.uid(), 'superadmin'::app_role))
with check (public.has_role(auth.uid(), 'superadmin'::app_role));

create policy "installer_releases superadmin delete"
on public.installer_releases for delete
to authenticated
using (public.has_role(auth.uid(), 'superadmin'::app_role));

-- Garante apenas um release marcado como current
create or replace function public.installer_releases_single_current()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_current then
    update public.installer_releases
       set is_current = false
     where id <> new.id and is_current = true;
  end if;
  return new;
end;
$$;

create trigger installer_releases_single_current_trg
before insert or update on public.installer_releases
for each row execute function public.installer_releases_single_current();

create index installer_releases_published_at_idx on public.installer_releases (published_at desc);
