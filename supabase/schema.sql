-- MJ Barbershop — Supabase schema.
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.
--
-- Security model: no RLS policies are created, so the tables are only
-- reachable with the service-role key — which the website uses server-side
-- only. The site never talks to Supabase from the browser.

-- All editable site content, stored as one JSON document (seeded
-- automatically by the website on first load).
create table if not exists public.site_content (
  id text primary key,
  content jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;

-- Submitted bookings (the /admin "Bookings" inbox).
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  ref text not null,
  name text not null,
  phone text not null,
  service_id text not null default '',
  service_name text not null,
  date date not null,
  time text not null,
  notes text not null default '',
  locale text not null default 'en',
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'completed', 'cancelled', 'no-show')),
  created_at timestamptz not null default now()
);
create index if not exists reservations_created_at_idx
  on public.reservations (created_at desc);
alter table public.reservations enable row level security;

-- Public bucket for images uploaded via /admin (public read, service-role write).
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;
