import { NextResponse, type NextRequest } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import {
  deleteReservation,
  listReservations,
  supabaseConfigured,
  updateReservationStatus
} from '@/lib/db';
import { RESERVATION_STATUSES } from '@/lib/types';

function unauthorized() {
  return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
}

function notConfigured() {
  return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });
}

export async function GET() {
  if (!(await isAdminRequest())) return unauthorized();
  if (!supabaseConfigured()) return notConfigured();
  try {
    return NextResponse.json({ ok: true, reservations: await listReservations() });
  } catch (err) {
    console.error('[admin] listReservations failed:', err);
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 });
  }
}

/** Body: { id, status } — updates one booking's status. */
export async function PATCH(req: NextRequest) {
  if (!(await isAdminRequest())) return unauthorized();
  if (!supabaseConfigured()) return notConfigured();

  let body: { id?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const status = RESERVATION_STATUSES.find((s) => s === body.status);
  if (!body.id || !status) {
    return NextResponse.json({ ok: false, error: 'invalid_input' }, { status: 400 });
  }

  try {
    const updated = await updateReservationStatus(body.id, status);
    if (!updated) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin] updateReservationStatus failed:', err);
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 });
  }
}

/** DELETE /api/admin/reservations?id=<id> */
export async function DELETE(req: NextRequest) {
  if (!(await isAdminRequest())) return unauthorized();
  if (!supabaseConfigured()) return notConfigured();

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'invalid_input' }, { status: 400 });

  try {
    const deleted = await deleteReservation(id);
    if (!deleted) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin] deleteReservation failed:', err);
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 });
  }
}
