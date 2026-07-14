/** Shared content types for the file-based CMS (data/content.json). */

export type Locale = 'en' | 'ar';

/** A bilingual string. */
export interface L {
  en: string;
  ar: string;
}

export type PackageCategory = 'hair' | 'beard' | 'combo' | 'kids' | 'vip' | 'addon';

/** Where a service can be performed — home visit, at the studio, or either. */
export const VENUES = ['home', 'shop', 'both'] as const;
export type Venue = (typeof VENUES)[number];

export interface Pkg {
  id: string;
  name: L;
  price: number;
  startingFrom?: boolean;
  duration: number;
  description: L;
  category: PackageCategory;
  popular?: boolean;
  /** Defaults to 'both' when unset (older content). */
  venue?: Venue;
  /** Image path under /public (seeded art or /uploads via the CMS). */
  image?: string | null;
}

export interface Stat {
  value: string;
  label: L;
}

export interface SiteSettings {
  tagline: L;
  heroEyebrow: L;
  heroTitle: L;
  heroSubtitle: L;
  aboutHeading: L;
  aboutBody: L[];
  founderName: L;
  founderRole: L;
  founderBio: L;
  stats: Stat[];
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  tiktok: string;
}

export const DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
] as const;

export type DayKey = (typeof DAY_KEYS)[number];

export interface DayHours {
  day: DayKey;
  closed?: boolean;
  open?: string;
  close?: string;
}

export interface BlockedDate {
  date: string; // YYYY-MM-DD
  reason?: string;
}

export interface ReservationSettings {
  heading: L;
  subheading: L;
  workingHours: DayHours[];
  blockedDates: BlockedDate[];
}

export interface LocationInfo {
  address: L;
  hoursText: L;
  lat: number;
  lng: number;
}

export interface GalleryItem {
  id: string;
  caption: L;
  /** Image path under /public (seeded art or /uploads via the CMS). */
  image: string;
}

export interface Testimonial {
  id: string;
  name: string;
  quote: L;
  rating: number;
}

export const RESERVATION_STATUSES = ['new', 'confirmed', 'completed', 'cancelled', 'no-show'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

/** A submitted booking, as stored in the Supabase `reservations` table. */
export interface StoredReservation {
  id: string;
  ref: string;
  name: string;
  phone: string;
  serviceId: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  notes: string;
  /** 'home' = we go to the client, 'shop' = client comes to the studio. */
  venue: Exclude<Venue, 'both'>;
  /** Client address for home visits (empty for studio bookings). */
  address: string;
  locale: Locale;
  status: ReservationStatus;
  createdAt: string; // ISO datetime
}

/** Everything the page needs, CMS-backed with per-piece fallbacks. */
export interface SiteContent {
  site: SiteSettings;
  reservation: ReservationSettings;
  location: LocationInfo;
  packages: Pkg[];
  gallery: GalleryItem[];
  testimonials: Testimonial[];
}

/** Pick the right language variant with a graceful fallback chain. */
export function t(l: Partial<L> | undefined | null, locale: Locale): string {
  if (!l) return '';
  return l[locale] || l.en || l.ar || '';
}
