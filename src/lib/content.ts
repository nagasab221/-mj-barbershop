/**
 * Content access for the public site, thin wrapper over the file store
 * so page components don't care where content lives.
 */
import { getContent } from '@/lib/db';
import type { ReservationSettings, SiteContent } from '@/lib/types';

export async function getSiteContent(): Promise<SiteContent> {
  return getContent();
}

/** Booking settings only, used by the reservation API for validation. */
export async function getReservationSettings(): Promise<ReservationSettings> {
  return (await getContent()).reservation;
}
