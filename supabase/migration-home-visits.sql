-- Migration: home-visit bookings (run once in Supabase → SQL Editor).
-- Adds where the appointment happens and the client's address for home visits.
-- Run this BEFORE deploying the home-visit version of the site.
-- (Until it runs, the site keeps working: venue/address are folded into notes.)

alter table public.reservations
  add column if not exists venue text not null default 'shop'
    check (venue in ('home', 'shop')),
  add column if not exists address text not null default '';
