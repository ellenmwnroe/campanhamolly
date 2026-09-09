create table if not exists public.tickets (
  number integer primary key check (number between 1 and 80),
  status text not null default 'available' check (status in ('available', 'pending', 'paid')),
  buyer_name text,
  buyer_email text,
  buyer_phone text,
  payment_id text,
  reserved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.tickets (number)
select generate_series(1, 80)
on conflict (number) do nothing;

alter table public.tickets enable row level security;

drop policy if exists "Anyone can read ticket availability" on public.tickets;
create policy "Anyone can read ticket availability"
  on public.tickets
  for select
  to anon, authenticated
  using (true);

alter table public.tickets replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.tickets;
exception
  when duplicate_object then null;
end $$;
