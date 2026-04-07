create table if not exists public.shop_catalogs (
  shop_key text primary key,
  shop_name text not null,
  category text not null check (category in ('drink', 'food')),
  menu_items jsonb not null default '[]'::jsonb,
  addon_options jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists shop_catalogs_shop_name_category_idx
  on public.shop_catalogs (shop_name, category);

alter table public.shop_catalogs enable row level security;

drop policy if exists "Public can read shop catalogs" on public.shop_catalogs;
create policy "Public can read shop catalogs"
  on public.shop_catalogs
  for select
  using (true);
