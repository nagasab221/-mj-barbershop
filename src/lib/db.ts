/**
 * Data layer for the custom CMS, backed by Supabase:
 *
 *   site_content  , one JSONB row (id 'main') holding all editable content,
 *                    seeded from src/lib/fallback-content.json on first load
 *   reservations  , submitted bookings (the /admin inbox)
 *   storage bucket 'uploads', images uploaded via /admin
 *
 * Everything runs server-side with the service-role key (see lib/supabase.ts).
 * When Supabase is not configured, the public site falls back to the built-in
 * demo content and write operations fail gracefully.
 */
import fallbackJson from '@/lib/fallback-content.json';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import type {
  Locale,
  ReservationSettings,
  ReservationStatus,
  SiteContent,
  StoredReservation
} from '@/lib/types';

export { supabaseConfigured, uploadsPublicPrefix } from '@/lib/supabase';

export const FALLBACK = fallbackJson as unknown as SiteContent;

const CONTENT_ROW_ID = 'main';

/** How a booking row looks in Postgres (snake_case). */
interface ReservationRow {
  id: string;
  ref: string;
  name: string;
  phone: string;
  service_id: string;
  service_name: string;
  date: string;
  time: string;
  notes: string;
  venue?: string;
  address?: string;
  area?: string;
  travel_fee?: number;
  locale: string;
  status: ReservationStatus;
  created_at: string;
}

function rowToReservation(row: ReservationRow): StoredReservation {
  return {
    id: row.id,
    ref: row.ref,
    name: row.name,
    phone: row.phone,
    serviceId: row.service_id,
    serviceName: row.service_name,
    date: row.date,
    time: row.time,
    notes: row.notes,
    venue: row.venue === 'home' ? 'home' : 'shop',
    address: row.address ?? '',
    area: row.area === 'outside' ? 'outside' : 'inside',
    travelFee: typeof row.travel_fee === 'number' ? row.travel_fee : 0,
    locale: (row.locale === 'ar' ? 'ar' : 'en') as Locale,
    status: row.status,
    createdAt: row.created_at
  };
}

// ── content ─────────────────────────────────────────────────────────

/** Merge stored content with fallbacks so missing pieces never break the site. */
function normalizeContent(raw: Partial<SiteContent> | null): SiteContent {
  if (!raw) return FALLBACK;
  const reservation: ReservationSettings = {
    heading: raw.reservation?.heading ?? FALLBACK.reservation.heading,
    subheading: raw.reservation?.subheading ?? FALLBACK.reservation.subheading,
    workingHours: raw.reservation?.workingHours?.length
      ? raw.reservation.workingHours
      : FALLBACK.reservation.workingHours,
    blockedDates: raw.reservation?.blockedDates ?? [],
    studioOpen: raw.reservation?.studioOpen ?? FALLBACK.reservation.studioOpen,
    areaName: raw.reservation?.areaName ?? FALLBACK.reservation.areaName,
    travelFee: raw.reservation?.travelFee ?? FALLBACK.reservation.travelFee
  };
  return {
    site: { ...FALLBACK.site, ...raw.site },
    reservation,
    location: { ...FALLBACK.location, ...raw.location },
    packages: raw.packages?.length ? raw.packages : FALLBACK.packages,
    gallery: raw.gallery?.length ? raw.gallery : FALLBACK.gallery,
    testimonials: raw.testimonials?.length ? raw.testimonials : FALLBACK.testimonials
  };
}

export async function getContent(): Promise<SiteContent> {
  if (!supabaseConfigured()) return FALLBACK;
  try {
    const { data, error } = await supabase()
      .from('site_content')
      .select('content')
      .eq('id', CONTENT_ROW_ID)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data?.content) return normalizeContent(data.content as Partial<SiteContent>);

    // First run: seed the row with the starter content.
    const { error: seedError } = await supabase()
      .from('site_content')
      .upsert({ id: CONTENT_ROW_ID, content: FALLBACK, updated_at: new Date().toISOString() });
    if (seedError) console.error('[db] failed to seed site_content:', seedError.message);
    return FALLBACK;
  } catch (err) {
    console.error('[db] getContent failed, serving fallback:', err);
    return FALLBACK;
  }
}

/** Throws on failure, callers surface the error to the admin UI. */
export async function saveContent(content: SiteContent): Promise<void> {
  const { error } = await supabase()
    .from('site_content')
    .upsert({ id: CONTENT_ROW_ID, content, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

// ── reservations ────────────────────────────────────────────────────

export async function listReservations(): Promise<StoredReservation[]> {
  const { data, error } = await supabase()
    .from('reservations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data as ReservationRow[]).map(rowToReservation);
}

export async function addReservation(
  input: Omit<StoredReservation, 'id' | 'status' | 'createdAt'>
): Promise<StoredReservation> {
  const base = {
    ref: input.ref,
    name: input.name,
    phone: input.phone,
    service_id: input.serviceId,
    service_name: input.serviceName,
    date: input.date,
    time: input.time,
    notes: input.notes,
    locale: input.locale
  };

  let { data, error } = await supabase()
    .from('reservations')
    .insert({
      ...base,
      venue: input.venue,
      address: input.address,
      area: input.area,
      travel_fee: input.travelFee
    })
    .select('*')
    .single();

  // Graceful pre-migration fallback: if the venue/address/area/travel_fee
  // columns don't exist yet (supabase/migration-home-visits.sql not run),
  // fold them into notes so no booking is ever lost.
  if (error && /venue|address|area|travel_fee|column/i.test(error.message)) {
    const parts = [
      input.venue === 'home' ? `[Home visit] ${input.address}` : '[Studio]',
      input.venue === 'home' ? (input.area === 'outside' ? 'Outside area' : 'Inside area') : '',
      input.travelFee > 0 ? `Travel +AED ${input.travelFee}` : '',
      input.notes
    ].filter(Boolean);
    ({ data, error } = await supabase()
      .from('reservations')
      .insert({ ...base, notes: parts.join(' | ') })
      .select('*')
      .single());
  }

  if (error) throw new Error(error.message);
  return rowToReservation(data as ReservationRow);
}

/** Look up one booking by its public credentials (reference + phone). */
export async function findReservation(ref: string, phone: string): Promise<StoredReservation | null> {
  const { data, error } = await supabase()
    .from('reservations')
    .select('*')
    .eq('ref', ref)
    .eq('phone', phone)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToReservation(data as ReservationRow) : null;
}

/** Client-initiated reschedule: new slot, status back to 'new' for re-confirmation. */
export async function rescheduleReservation(
  ref: string,
  phone: string,
  date: string,
  time: string
): Promise<boolean> {
  const { data, error } = await supabase()
    .from('reservations')
    .update({ date, time, status: 'new' })
    .eq('ref', ref)
    .eq('phone', phone)
    .in('status', ['new', 'confirmed'])
    .select('id');
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

/** Client-initiated cancellation. */
export async function cancelReservation(ref: string, phone: string): Promise<boolean> {
  const { data, error } = await supabase()
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('ref', ref)
    .eq('phone', phone)
    .in('status', ['new', 'confirmed'])
    .select('id');
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus
): Promise<boolean> {
  const { data, error } = await supabase()
    .from('reservations')
    .update({ status })
    .eq('id', id)
    .select('id');
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

export async function deleteReservation(id: string): Promise<boolean> {
  const { data, error } = await supabase()
    .from('reservations')
    .delete()
    .eq('id', id)
    .select('id');
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}
