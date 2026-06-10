-- Ekzekuto këtë në Supabase: SQL Editor -> New query -> Run

create table products (
  id bigint generated always as identity primary key,
  sku text not null,
  name text not null,
  category text not null default 'Ushqimore',
  stock integer not null default 0,
  min integer not null default 0,
  price numeric not null default 0,
  currency text not null default 'EUR',
  sold integer not null default 0,
  created_at timestamptz default now()
);

create table orders (
  id text primary key,
  customer text not null,
  items integer not null default 0,
  total numeric not null default 0,
  status text not null default 'Në pritje',
  date text
);

-- Akses i hapur për fillim (shto login më vonë për siguri)
alter table products enable row level security;
alter table orders enable row level security;
create policy "public products" on products for all using (true) with check (true);
create policy "public orders" on orders for all using (true) with check (true);
