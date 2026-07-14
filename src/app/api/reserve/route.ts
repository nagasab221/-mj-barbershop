import { NextResponse, type NextRequest } from 'next/server';

import { getSiteContent } from '@/lib/content';
import { addReservation, supabaseConfigured } from '@/lib/db';
import { isBookableSlot, normalizeUAEPhone } from '@/lib/booking';
import { escapeHtml, sendTelegramMessage, telegramConfigured } from '@/lib/telegram';
import { formatDate, rateLimit } from '@/lib/utils';

interface ReservePayload {
  name?: string;
  phone?: string;
  serviceId?: string;
  serviceName?: string;
  servicePrice?: number;
  date?: string;
  time?: string;
  notes?: string;
  venue?: string;
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
  const serviceName = (body.serviceName ?? '').trim();
  const serviceId = (body.serviceId ?? '').trim().slice(0, 64);
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
  if (!serviceName || serviceName.length > 120) {
    return NextResponse.json({ ok: false, error: 'invalid_service' }, { status: 400 });
  }

  // Venue: constrained to what the chosen package actually offers.
  const content = await getSiteContent();
  const settings = content.reservation;
  const pkgVenue = content.packages.find((p) => p.id === serviceId)?.venue ?? 'both';
  let venue: 'home' | 'shop' = body.venue === 'home' ? 'home' : 'shop';
  if (pkgVenue !== 'both') venue = pkgVenue;
  const address = venue === 'home' ? (body.address ?? '').trim().slice(0, 300) : '';
  if (venue === 'home' && address.length < 5) {
    return NextResponse.json({ ok: false, error: 'invalid_address' }, { status: 400 });
  }

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
    const lines = [
      '💈 <b>New Reservation — MJ Barbershop</b>',
      '',
      `👤 <b>Name:</b> ${escapeHtml(name)}`,
      `📱 <b>Phone:</b> ${escapeHtml(phone)}`,
      `✂️ <b>Service:</b> ${escapeHtml(serviceName)}`,
      `📅 <b>Date:</b> ${escapeHtml(formatDate(date, 'en'))}`,
      `🕐 <b>Time:</b> ${escapeHtml(time)}`,
      venue === 'home'
        ? `🏠 <b>Home visit:</b> ${escapeHtml(address)}`
        : '💈 <b>At the studio</b>',
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
