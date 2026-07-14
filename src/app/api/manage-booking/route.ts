import { NextResponse, type NextRequest } from 'next/server';

import { getReservationSettings } from '@/lib/content';
import {
  cancelReservation,
  findReservation,
  rescheduleReservation,
  supabaseConfigured
} from '@/lib/db';
import { isBookableSlot, normalizeUAEPhone } from '@/lib/booking';
import { escapeHtml, sendTelegramMessage, telegramConfigured } from '@/lib/telegram';
import { formatDate, rateLimit } from '@/lib/utils';
import type { StoredReservation } from '@/lib/types';

/**
 * Public self-service booking management. The booking reference + the phone
 * number it was made with act as the credentials.
 *
 *   POST { action: 'lookup',     ref, phone }
 *   POST { action: 'reschedule', ref, phone, date, time }
 *   POST { action: 'cancel',     ref, phone }
 */

interface ManagePayload {
  action?: string;
  ref?: string;
  phone?: string;
  date?: string;
  time?: string;
}

const REF_RE = /^MJ-[A-Z0-9]{5}$/;

/** Only what the client needs to see — never internal ids. */
function publicView(r: StoredReservation) {
  return {
    ref: r.ref,
    name: r.name,
    serviceName: r.serviceName,
    date: r.date,
    time: r.time,
    venue: r.venue,
    address: r.address,
    status: r.status
  };
}

async function notifyOwner(kind: 'reschedule' | 'cancel', r: StoredReservation, newDate?: string, newTime?: string) {
  if (!telegramConfigured()) return;
  const lines =
    kind === 'reschedule'
      ? [
          '🔁 <b>Booking Rescheduled — MJ Barbershop</b>',
          '',
          `👤 <b>Name:</b> ${escapeHtml(r.name)}`,
          `📱 <b>Phone:</b> ${escapeHtml(r.phone)}`,
          `✂️ <b>Service:</b> ${escapeHtml(r.serviceName)}`,
          `📅 <b>New date:</b> ${escapeHtml(formatDate(newDate!, 'en'))} at ${escapeHtml(newTime!)}`,
          `↩️ <b>Was:</b> ${escapeHtml(formatDate(r.date, 'en'))} at ${escapeHtml(r.time)}`,
          `🔖 <b>Ref:</b> ${r.ref}`
        ]
      : [
          '❌ <b>Booking Cancelled — MJ Barbershop</b>',
          '',
          `👤 <b>Name:</b> ${escapeHtml(r.name)}`,
          `📱 <b>Phone:</b> ${escapeHtml(r.phone)}`,
          `✂️ <b>Service:</b> ${escapeHtml(r.serviceName)}`,
          `📅 <b>Was:</b> ${escapeHtml(formatDate(r.date, 'en'))} at ${escapeHtml(r.time)}`,
          `🔖 <b>Ref:</b> ${r.ref}`
        ];
  await sendTelegramMessage(lines.join('\n'));
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`manage:${ip}`, 12, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }
  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });
  }

  let body: ManagePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const ref = (body.ref ?? '').trim().toUpperCase();
  const phone = normalizeUAEPhone(body.phone ?? '');
  if (!REF_RE.test(ref) || !phone) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  try {
    const booking = await findReservation(ref, phone);
    if (!booking) {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    }

    switch (body.action) {
      case 'lookup':
        return NextResponse.json({ ok: true, booking: publicView(booking) });

      case 'reschedule': {
        if (booking.status !== 'new' && booking.status !== 'confirmed') {
          return NextResponse.json({ ok: false, error: 'not_changeable' }, { status: 409 });
        }
        const date = (body.date ?? '').trim();
        const time = (body.time ?? '').trim();
        const settings = await getReservationSettings();
        if (!isBookableSlot(settings, date, time)) {
          return NextResponse.json({ ok: false, error: 'invalid_slot' }, { status: 400 });
        }
        const changed = await rescheduleReservation(ref, phone, date, time);
        if (!changed) {
          return NextResponse.json({ ok: false, error: 'not_changeable' }, { status: 409 });
        }
        await notifyOwner('reschedule', booking, date, time);
        return NextResponse.json({
          ok: true,
          booking: publicView({ ...booking, date, time, status: 'new' })
        });
      }

      case 'cancel': {
        if (booking.status !== 'new' && booking.status !== 'confirmed') {
          return NextResponse.json({ ok: false, error: 'not_changeable' }, { status: 409 });
        }
        const cancelled = await cancelReservation(ref, phone);
        if (!cancelled) {
          return NextResponse.json({ ok: false, error: 'not_changeable' }, { status: 409 });
        }
        await notifyOwner('cancel', booking);
        return NextResponse.json({
          ok: true,
          booking: publicView({ ...booking, status: 'cancelled' })
        });
      }

      default:
        return NextResponse.json({ ok: false, error: 'invalid_action' }, { status: 400 });
    }
  } catch (err) {
    console.error('[manage-booking] failed:', err);
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 });
  }
}
