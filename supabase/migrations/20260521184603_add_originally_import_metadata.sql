alter table public.categories
  add column if not exists image_url text,
  add column if not exists banner_url text,
  add column if not exists source_platform text,
  add column if not exists source_id text,
  add column if not exists source_url text,
  add column if not exists last_imported_at timestamptz;

alter table public.products
  add column if not exists source_platform text,
  add column if not exists source_id text,
  add column if not exists source_url text,
  add column if not exists last_imported_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.product_images
  add column if not exists source_url text,
  add column if not exists content_hash text,
  add column if not exists last_imported_at timestamptz;

alter table public.product_variants
  add column if not exists source_id text,
  add column if not exists source_code text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.import_runs (
  id uuid primary key default gen_random_uuid(),
  source_platform text not null,
  source_url text not null,
  status text not null check (status in ('running', 'completed', 'failed')),
  products_seen int not null default 0,
  products_imported int not null default 0,
  categories_imported int not null default 0,
  images_seen int not null default 0,
  images_uploaded int not null default 0,
  errors jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create unique index if not exists categories_source_platform_source_id_idx
  on public.categories (source_platform, source_id);

create unique index if not exists products_source_platform_source_id_idx
  on public.products (source_platform, source_id);

create unique index if not exists product_images_product_source_url_idx
  on public.product_images (product_id, source_url);

create unique index if not exists product_variants_product_source_id_idx
  on public.product_variants (product_id, source_id);

alter table public.import_runs enable row level security;

create policy "admins can read import runs" on public.import_runs
for select using (app_private.is_admin());

create policy "admins can manage import runs" on public.import_runs
for all using (app_private.is_admin()) with check (app_private.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.categories to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.product_images to anon, authenticated;
grant select on public.product_variants to anon, authenticated;
grant select on public.home_slots to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant select, insert, update, delete on public.import_runs to authenticated;

notify pgrst, 'reload schema';
