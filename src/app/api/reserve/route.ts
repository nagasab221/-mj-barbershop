import { NextResponse, type NextRequest } from 'next/server';

import { getSiteContent } from '@/lib/content';
import { addReservation, supabaseConfigured } from '@/lib/db';
import { isBookableSlot, normalizeUAEPhone } from '@/lib/booking';
import { escapeHtml, sendTelegramMessage, telegramConfigured } from '@/lib/telegram';
import { formatDate, rateLimit } from '@/lib/utils';

interface ReservePayload {
  name?: string;
  phone?: string;
  /** One or more chosen packages. `serviceId` is the older single-service form. */
  serviceIds?: string[];
  serviceId?: string;
  serviceName?: string;
  date?: string;
  time?: string;
  notes?: string;
  venue?: string;
  area?: string;
  address?: string;
  locale?: string;
  company?: string; // honeypot
}

function bookingRef(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no lookalike chars
  let out = '';
  for (let i = 0; i < 5; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `MJ-${out}`;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`reserve:${ip}`, 6, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  let body: ReservePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  // Honeypot filled → almost certainly a bot. Pretend success, do nothing.
  if (body.company) {
    return NextResponse.json({ ok: true, ref: bookingRef(), stored: false, notified: false });
  }

  const name = (body.name ?? '').trim();
  const phone = normalizeUAEPhone(body.phone ?? '');
  const date = (body.date ?? '').trim();
  const time = (body.time ?? '').trim();
  const notes = (body.notes ?? '').trim().slice(0, 500);
  const locale = body.locale === 'ar' ? ('ar' as const) : ('en' as const);

  if (name.length < 2 || name.length > 80) {
    return NextResponse.json({ ok: false, error: 'invalid_name' }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ ok: false, error: 'invalid_phone' }, { status: 400 });
  }

  const content = await getSiteContent();
  const settings = content.reservation;

  // Resolve the chosen packages against the CMS so names and prices are
  // authoritative (the client can't invent a service or a price).
  const requestedIds = (
    Array.isArray(body.serviceIds) && body.serviceIds.length
      ? body.serviceIds
      : [body.serviceId ?? '']
  )
    .map((id) => String(id).trim().slice(0, 64))
    .filter(Boolean)
    .slice(0, 10);

  const chosen = content.packages.filter((p) => requestedIds.includes(p.id));
  if (chosen.length === 0) {
    return NextResponse.json({ ok: false, error: 'invalid_service' }, { status: 400 });
  }

  const serviceId = chosen.map((p) => p.id).join(',');
  const serviceName = chosen.map((p) => p.name.en || p.name.ar).join(' + ').slice(0, 300);
  const subtotal = chosen.reduce((sum, p) => sum + (p.price || 0), 0);

  // Venue: forced to home while the studio is "coming soon"; otherwise a
  // fixed-venue service pins it, and anything else honours the client's pick.
  const fixedVenues = Array.from(new Set(chosen.map((p) => p.venue ?? 'both').filter((v) => v !== 'both')));
  let venue: 'home' | 'shop';
  if (!settings.studioOpen) {
    venue = 'home';
  } else if (fixedVenues.length === 1) {
    venue = fixedVenues[0] as 'home' | 'shop';
  } else {
    venue = body.venue === 'shop' ? 'shop' : 'home';
  }

  const address = venue === 'home' ? (body.address ?? '').trim().slice(0, 300) : '';
  if (venue === 'home' && address.length < 5) {
    return NextResponse.json({ ok: false, error: 'invalid_address' }, { status: 400 });
  }

  // Area-based travel fee (home visits only).
  const area: 'inside' | 'outside' = venue === 'home' && body.area === 'outside' ? 'outside' : 'inside';
  const travelFee = area === 'outside' ? Math.max(0, Math.round(settings.travelFee || 0)) : 0;
  const total = subtotal + travelFee;

  if (!isBookableSlot(settings, date, time)) {
    return NextResponse.json({ ok: false, error: 'invalid_slot' }, { status: 400 });
  }

  const ref = bookingRef();

  // 1) Store in the bookings inbox (Supabase `reservations` → /admin).
  let stored = false;
  if (supabaseConfigured()) {
    try {
      await addReservation({
        ref,
        name,
        phone,
        serviceId,
        serviceName,
        date,
        time,
        notes,
        venue,
        address,
        area,
        travelFee,
        locale
      });
      stored = true;
    } catch (err) {
      console.error('[reserve] failed to store reservation:', err);
    }
  }

  // 2) Notify the owner on Telegram.
  let notified = false;
  if (telegramConfigured()) {
    const serviceLines =
      chosen.length === 1
        ? `✂️ <b>Service:</b> ${escapeHtml(serviceName)}`
        : [
            `✂️ <b>Services (${chosen.length}):</b>`,
            ...chosen.map((p) => `   • ${escapeHtml(p.name.en || p.name.ar)} (AED ${p.price})`)
          ].join('\n');

    const lines = [
      '💈 <b>New Booking, MJ Barbershop</b>',
      '',
      `👤 <b>Name:</b> ${escapeHtml(name)}`,
      `📱 <b>Phone:</b> ${escapeHtml(phone)}`,
      serviceLines,
      `📅 <b>Date:</b> ${escapeHtml(formatDate(date, 'en'))}`,
      `🕐 <b>Time:</b> ${escapeHtml(time)}`,
      venue === 'home'
        ? `🏠 <b>Home visit:</b> ${escapeHtml(address)}`
        : '💈 <b>At the studio</b>',
      venue === 'home'
        ? `📍 <b>Area:</b> ${area === 'outside' ? `Outside ${escapeHtml(settings.areaName.en || 'area')} (+AED ${travelFee})` : `Inside ${escapeHtml(settings.areaName.en || 'area')}`}`
        : null,
      `💰 <b>Total:</b> AED ${total}${travelFee > 0 ? ` (incl. AED ${travelFee} travel)` : ''}`,
      notes ? `📝 <b>Notes:</b> ${escapeHtml(notes)}` : null,
      `🌐 <b>Booked via:</b> ${locale === 'ar' ? 'Arabic site' : 'English site'}`,
      `🔖 <b>Ref:</b> ${ref}`,
      '',
      'Manage this booking at /admin.'
    ].filter((l): l is string => l !== null);
    notified = await sendTelegramMessage(lines.join('\n'));
  }

  // Demo mode (nothing configured at all) still succeeds so the site is testable.
  const demoMode = !supabaseConfigured() && !telegramConfigured();
  if (!stored && !notified && !demoMode) {
    return NextResponse.json({ ok: false, error: 'delivery_failed' }, { status: 502 });
  }

  return NextResponse.json({ ok: true, ref, stored, notified });
}
