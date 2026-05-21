create extension if not exists pgcrypto;
create schema if not exists app_private;

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'admin' check (role in ('admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  short_description text,
  description text not null,
  price_cents int not null check (price_cents >= 0),
  whatsapp_message text,
  badge text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text,
  storage_path text,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  color text not null,
  stock int not null default 0 check (stock >= 0),
  price_cents int check (price_cents is null or price_cents >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.home_slots (
  id uuid primary key default gen_random_uuid(),
  position text not null check (position in ('hero', 'destaques', 'novidades', 'colecao')),
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique(position, product_id)
);

create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create or replace function app_private.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where id = auth.uid()
      and active = true
  );
$$;

alter table public.admin_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.home_slots enable row level security;
alter table public.site_settings enable row level security;

create policy "admins can read admin profiles" on public.admin_profiles for select using (app_private.is_admin());
create policy "admins can manage admin profiles" on public.admin_profiles for all using (app_private.is_admin()) with check (app_private.is_admin());

create policy "public can read categories" on public.categories for select using (true);
create policy "admins can manage categories" on public.categories for all using (app_private.is_admin()) with check (app_private.is_admin());

create policy "public can read published products" on public.products for select using (status = 'published' or app_private.is_admin());
create policy "admins can manage products" on public.products for all using (app_private.is_admin()) with check (app_private.is_admin());

create policy "public can read product images" on public.product_images for select using (true);
create policy "admins can manage product images" on public.product_images for all using (app_private.is_admin()) with check (app_private.is_admin());

create policy "public can read active variants for published products" on public.product_variants
for select using (
  app_private.is_admin()
  or exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'published'
  )
);
create policy "admins can manage product variants" on public.product_variants for all using (app_private.is_admin()) with check (app_private.is_admin());

create policy "public can read home slots" on public.home_slots for select using (true);
create policy "admins can manage home slots" on public.home_slots for all using (app_private.is_admin()) with check (app_private.is_admin());

create policy "public can read site settings" on public.site_settings for select using (true);
create policy "admins can manage site settings" on public.site_settings for all using (app_private.is_admin()) with check (app_private.is_admin());

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "public can read product image files" on storage.objects
for select using (bucket_id = 'product-images');

create policy "admins can upload product image files" on storage.objects
for insert with check (bucket_id = 'product-images' and app_private.is_admin());

create policy "admins can update product image files" on storage.objects
for update using (bucket_id = 'product-images' and app_private.is_admin())
with check (bucket_id = 'product-images' and app_private.is_admin());

create policy "admins can delete product image files" on storage.objects
for delete using (bucket_id = 'product-images' and app_private.is_admin());

insert into public.site_settings (key, value) values
  ('whatsapp_number', '5511999999999'),
  ('whatsapp_default_message', 'Ola! Tenho interesse em produtos da Originally.'),
  ('whatsapp_button_label', 'Comprar pelo WhatsApp')
on conflict (key) do nothing;
