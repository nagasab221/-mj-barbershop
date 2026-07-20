import { NextResponse, type NextRequest } from 'next/server';

import { escapeHtml, sendTelegramMessage, telegramConfigured } from '@/lib/telegram';
import { rateLimit } from '@/lib/utils';

interface ContactPayload {
  name?: string;
  contact?: string;
  message?: string;
  locale?: string;
  company?: string; // honeypot
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  let body: ContactPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  if (body.company) {
    return NextResponse.json({ ok: true }); // honeypot
  }

  const name = (body.name ?? '').trim().slice(0, 80);
  const contact = (body.contact ?? '').trim().slice(0, 120);
  const message = (body.message ?? '').trim().slice(0, 1000);
  const locale = body.locale === 'ar' ? 'ar' : 'en';

  if (message.length < 3) {
    return NextResponse.json({ ok: false, error: 'invalid_message' }, { status: 400 });
  }

  if (!telegramConfigured()) {
    // Demo mode, accept so the form is testable before configuration.
    return NextResponse.json({ ok: true, notified: false });
  }

  const lines = [
    '✉️ <b>New Message, MJ Barbershop</b>',
    '',
    name ? `👤 <b>Name:</b> ${escapeHtml(name)}` : null,
    contact ? `📱 <b>Contact:</b> ${escapeHtml(contact)}` : null,
    `💬 <b>Message:</b>`,
    escapeHtml(message),
    '',
    `🌐 <b>Sent via:</b> ${locale === 'ar' ? 'Arabic site' : 'English site'}`
  ].filter((l): l is string => l !== null);

  const notified = await sendTelegramMessage(lines.join('\n'));
  if (!notified) {
    return NextResponse.json({ ok: false, error: 'delivery_failed' }, { status: 502 });
  }
  return NextResponse.json({ ok: true, notified });
}
