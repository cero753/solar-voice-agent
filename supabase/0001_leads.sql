-- Leads captured by the Solar Voice Advisor.
create table if not exists public.leads (
  id                   text primary key,
  created_at           timestamptz not null default now(),
  status               text not null default 'booked',
  name                 text default '',
  phone                text default '',
  email                text default '',
  address              text default '',
  monthly_bill         numeric,
  home_type            text default 'unknown',
  owns_roof            boolean,
  credit_above_650     text default 'unsure',
  shading              text default '',
  utility_provider     text default '',
  decision_makers      text default '',
  appointment_datetime text default '',
  appointment_type     text default '',
  language_booked_in   text default '',
  disqual_reason       text default '',
  notes                text default '',
  transcript           jsonb default '[]'::jsonb
);

alter table public.leads enable row level security;

-- Demo policies: the public site captures and lists leads with the anon key.
-- (For production you'd restrict SELECT to an authenticated dashboard.)
drop policy if exists "anon insert leads" on public.leads;
create policy "anon insert leads" on public.leads
  for insert to anon with check (true);

drop policy if exists "anon read leads" on public.leads;
create policy "anon read leads" on public.leads
  for select to anon using (true);
