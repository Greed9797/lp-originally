create table if not exists public.whatsapp_contact_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  placement text not null check (placement in ('home', 'product', 'floating', 'collection', 'header', 'footer')),
  source_path text,
  session_id text,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_contact_events_created_at_idx
  on public.whatsapp_contact_events (created_at desc);

create index if not exists whatsapp_contact_events_product_id_idx
  on public.whatsapp_contact_events (product_id);

create index if not exists whatsapp_contact_events_placement_idx
  on public.whatsapp_contact_events (placement);

alter table public.whatsapp_contact_events enable row level security;

create policy "admins can read whatsapp contact events" on public.whatsapp_contact_events
for select using (app_private.is_admin());

create policy "admins can manage whatsapp contact events" on public.whatsapp_contact_events
for all using (app_private.is_admin()) with check (app_private.is_admin());

grant select, insert, update, delete on public.whatsapp_contact_events to authenticated;

notify pgrst, 'reload schema';
