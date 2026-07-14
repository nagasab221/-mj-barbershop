import type { Locale } from '@/lib/types';

/** Build a wa.me click-to-chat link with a prefilled message. */
export function whatsappLink(number: string, text: string): string {
  const digits = number.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function defaultWhatsappGreeting(locale: Locale): string {
  return locale === 'ar'
    ? 'مرحباً MJ Barbershop! أرغب بحجز موعد.'
    : "Hello MJ Barbershop! I'd like to book an appointment.";
}

/** Human-readable date for confirmations, e.g. "Monday, 20 July 2026". */
export function formatDate(dateISO: string, locale: Locale): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-AE-u-nu-latn' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(dt);
}

/** "AED 90" / "90 د.إ" with an optional "from" prefix. */
export function formatPrice(price: number, locale: Locale, startingFrom?: boolean): string {
  const n = price.toLocaleString('en-US');
  if (locale === 'ar') {
    return `${startingFrom ? 'ابتداءً من ' : ''}${n} د.إ`;
  }
  return `${startingFrom ? 'from ' : ''}AED ${n}`;
}

/** In-memory fixed-window rate limiter (per server instance, best effort). */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((ts) => now - ts < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (buckets.size > 5000) {
    buckets.forEach((hitTimes, k) => {
      if (hitTimes.every((ts) => now - ts >= windowMs)) buckets.delete(k);
    });
  }
  return true;
}
