create table if not exists public.instagram_tiles (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  storage_path text,
  alt_text text,
  link_url text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists instagram_tiles_active_sort_idx
  on public.instagram_tiles (active, sort_order);

alter table public.instagram_tiles enable row level security;

create policy "public can read active instagram tiles" on public.instagram_tiles
for select using (active = true or app_private.is_admin());

create policy "admins can manage instagram tiles" on public.instagram_tiles
for all using (app_private.is_admin()) with check (app_private.is_admin());

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

create policy "public can read site asset files" on storage.objects
for select using (bucket_id = 'site-assets');

create policy "admins can upload site asset files" on storage.objects
for insert with check (bucket_id = 'site-assets' and app_private.is_admin());

create policy "admins can update site asset files" on storage.objects
for update using (bucket_id = 'site-assets' and app_private.is_admin())
with check (bucket_id = 'site-assets' and app_private.is_admin());

create policy "admins can delete site asset files" on storage.objects
for delete using (bucket_id = 'site-assets' and app_private.is_admin());

grant select on public.instagram_tiles to anon, authenticated;
grant select, insert, update, delete on public.instagram_tiles to authenticated;

notify pgrst, 'reload schema';
