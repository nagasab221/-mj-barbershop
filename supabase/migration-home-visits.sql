-- Migration: home-visit bookings + area-based travel pricing.
-- Run once in Supabase → SQL Editor (safe to re-run; all columns use IF NOT EXISTS).
-- Run this BEFORE deploying the home-visit / travel-fee version of the site.
-- (Until it runs, the site keeps working: the extra fields fold into `notes`.)

alter table public.reservations
  add column if not exists venue text not null default 'home'
    check (venue in ('home', 'shop')),
  add column if not exists address text not null default '',
  add column if not exists area text not null default 'inside'
    check (area in ('inside', 'outside')),
  add column if not exists travel_fee numeric not null default 0;
