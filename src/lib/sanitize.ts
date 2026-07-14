/**
 * Sanitizes content submitted from the admin dashboard before it is
 * written to disk: whitelists fields, trims and caps strings, coerces
 * numbers, and drops anything malformed. Guarantees the stored file
 * always matches the SiteContent shape.
 */
import { uploadsPublicPrefix } from '@/lib/supabase';
import {
  DAY_KEYS,
  VENUES,
  type BlockedDate,
  type DayHours,
  type L,
  type PackageCategory,
  type SiteContent
} from '@/lib/types';

const CATEGORIES: PackageCategory[] = ['hair', 'beard', 'combo', 'kids', 'vip', 'addon'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function num(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function loc(v: unknown, max = 500): L {
  const o = (v ?? {}) as Partial<L>;
  return { en: str(o.en, max), ar: str(o.ar, max) };
}

function id(v: unknown): string {
  const s = str(v, 64);
  return /^[\w-]+$/.test(s) && s.length >= 3 ? s : `item-${crypto.randomUUID()}`;
}

/** Seeded art or images from our own Supabase uploads bucket — nothing else. */
function imagePath(v: unknown): string {
  const s = str(v, 500);
  if (s.startsWith('/gallery/')) return s;
  const prefix = uploadsPublicPrefix();
  if (prefix && s.startsWith(prefix)) return s;
  return '';
}

function arr<T>(v: unknown, max: number, map: (item: unknown) => T | null): T[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, max).map(map).filter((x): x is T => x !== null);
}

export function sanitizeContent(input: unknown): SiteContent {
  const raw = (input ?? {}) as Record<string, unknown>;
  const site = (raw.site ?? {}) as Record<string, unknown>;
  const reservation = (raw.reservation ?? {}) as Record<string, unknown>;
  const location = (raw.location ?? {}) as Record<string, unknown>;

  return {
    site: {
      tagline: loc(site.tagline, 200),
      heroEyebrow: loc(site.heroEyebrow, 200),
      heroTitle: loc(site.heroTitle, 200),
      heroSubtitle: loc(site.heroSubtitle, 500),
      aboutHeading: loc(site.aboutHeading, 200),
      aboutBody: arr(site.aboutBody, 10, (p) => loc(p, 1200)),
      founderName: loc(site.founderName, 120),
      founderRole: loc(site.founderRole, 120),
      founderBio: loc(site.founderBio, 1200),
      stats: arr(site.stats, 8, (s) => {
        const o = (s ?? {}) as Record<string, unknown>;
        const value = str(o.value, 20);
        return value ? { value, label: loc(o.label, 80) } : null;
      }),
      phone: str(site.phone, 30),
      whatsapp: str(site.whatsapp, 30).replace(/[^\d]/g, ''),
      email: str(site.email, 120),
      instagram: str(site.instagram, 300),
      tiktok: str(site.tiktok, 300)
    },
    reservation: {
      heading: loc(reservation.heading, 200),
      subheading: loc(reservation.subheading, 500),
      workingHours: arr<DayHours>(reservation.workingHours, 7, (h) => {
        const o = (h ?? {}) as Record<string, unknown>;
        const day = DAY_KEYS.find((d) => d === o.day);
        if (!day) return null;
        const open = str(o.open, 5);
        const close = str(o.close, 5);
        return {
          day,
          closed: Boolean(o.closed),
          open: TIME_RE.test(open) ? open : undefined,
          close: TIME_RE.test(close) ? close : undefined
        };
      }),
      blockedDates: arr<BlockedDate>(reservation.blockedDates, 200, (b) => {
        const o = (b ?? {}) as Record<string, unknown>;
        const date = str(o.date, 10);
        if (!DATE_RE.test(date)) return null;
        return { date, reason: str(o.reason, 120) || undefined };
      })
    },
    location: {
      address: loc(location.address, 500),
      hoursText: loc(location.hoursText, 200),
      lat: num(location.lat, -90, 90, 25.2323),
      lng: num(location.lng, -180, 180, 55.2603)
    },
    packages: arr(raw.packages, 100, (p) => {
      const o = (p ?? {}) as Record<string, unknown>;
      const name = loc(o.name, 150);
      if (!name.en && !name.ar) return null;
      const category = CATEGORIES.find((c) => c === o.category) ?? 'hair';
      return {
        id: id(o.id),
        name,
        price: num(o.price, 0, 1_000_000, 0),
        startingFrom: Boolean(o.startingFrom),
        duration: num(o.duration, 5, 600, 30),
        description: loc(o.description, 600),
        category,
        popular: Boolean(o.popular),
        venue: VENUES.find((v) => v === o.venue) ?? 'both',
        image: imagePath(o.image) || null
      };
    }),
    gallery: arr(raw.gallery, 100, (g) => {
      const o = (g ?? {}) as Record<string, unknown>;
      const image = imagePath(o.image);
      if (!image) return null;
      return { id: id(o.id), caption: loc(o.caption, 200), image };
    }),
    testimonials: arr(raw.testimonials, 100, (t) => {
      const o = (t ?? {}) as Record<string, unknown>;
      const name = str(o.name, 80);
      const quote = loc(o.quote, 600);
      if (!name || (!quote.en && !quote.ar)) return null;
      return { id: id(o.id), name, quote, rating: Math.round(num(o.rating, 1, 5, 5)) };
    })
  };
}
