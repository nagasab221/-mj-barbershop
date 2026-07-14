import { DAY_KEYS, type DayHours, type DayKey, type ReservationSettings } from '@/lib/types';

/** How far ahead clients may book, in days. */
export const MAX_ADVANCE_DAYS = 90;

/** Slot granularity in minutes. */
const SLOT_STEP = 30;

/** Same-day bookings need at least this much lead time (minutes). */
const SAME_DAY_LEAD = 60;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Normalize a UAE mobile number to +9715XXXXXXXX.
 * Accepts 05x xxx xxxx, 5xxxxxxxx, +9715xxxxxxxx, 009715xxxxxxxx.
 * Returns null when the input is not a valid UAE mobile.
 */
export function normalizeUAEPhone(raw: string): string | null {
  const cleaned = raw.replace(/[\s\-().]/g, '');
  const m = cleaned.match(/^(?:\+971|00971|971|0)?(5\d{8})$/);
  return m ? `+971${m[1]}` : null;
}

/** Today's date in the shop's timezone (Asia/Dubai), as YYYY-MM-DD. */
export function dubaiTodayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date());
}

/** Current time in Dubai as minutes since midnight. */
function dubaiNowMinutes(): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date());
  const [h, m] = parts.split(':').map(Number);
  return h * 60 + m;
}

export function isValidDateString(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function dayKeyOf(dateISO: string): DayKey {
  const [y, m, d] = dateISO.split('-').map(Number);
  return DAY_KEYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function addDaysISO(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function isBlocked(settings: ReservationSettings, dateISO: string): boolean {
  return settings.blockedDates.some((b) => b.date === dateISO);
}

export function hoursFor(settings: ReservationSettings, dateISO: string): DayHours | null {
  const key = dayKeyOf(dateISO);
  return settings.workingHours.find((h) => h.day === key) ?? null;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * All bookable time slots ("HH:MM") for a date, respecting working hours,
 * blocked dates, and a lead time for same-day bookings. Empty array when
 * the shop is closed that day.
 */
export function slotsForDate(settings: ReservationSettings, dateISO: string): string[] {
  if (!isValidDateString(dateISO)) return [];
  if (isBlocked(settings, dateISO)) return [];

  const hours = hoursFor(settings, dateISO);
  if (!hours || hours.closed || !hours.open || !hours.close) return [];
  if (!TIME_RE.test(hours.open) || !TIME_RE.test(hours.close)) return [];

  const openMin = toMinutes(hours.open);
  const closeMin = toMinutes(hours.close);
  if (closeMin - openMin < SLOT_STEP) return [];

  const today = dubaiTodayISO();
  const minStart = dateISO === today ? dubaiNowMinutes() + SAME_DAY_LEAD : 0;

  const slots: string[] = [];
  // Last slot starts one step before closing time.
  for (let t = openMin; t <= closeMin - SLOT_STEP; t += SLOT_STEP) {
    if (t < minStart) continue;
    const h = String(Math.floor(t / 60)).padStart(2, '0');
    const m = String(t % 60).padStart(2, '0');
    slots.push(`${h}:${m}`);
  }
  return slots;
}

/** Full server-side validation of a requested date+time. */
export function isBookableSlot(settings: ReservationSettings, dateISO: string, time: string): boolean {
  if (!isValidDateString(dateISO) || !TIME_RE.test(time)) return false;
  const today = dubaiTodayISO();
  if (dateISO < today || dateISO > addDaysISO(today, MAX_ADVANCE_DAYS)) return false;
  return slotsForDate(settings, dateISO).includes(time);
}

/** Format "18:30" for display, honouring the locale (Western digits kept for AR). */
export function formatSlot(time: string, locale: string): string {
  const [h, m] = time.split(':').map(Number);
  const dt = new Date(Date.UTC(2000, 0, 1, h, m));
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-AE-u-nu-latn' : 'en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC'
  }).format(dt);
}
