import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, SESSION_MAX_AGE, checkPassword, createSessionValue } from '@/lib/auth';
import { rateLimit } from '@/lib/utils';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`admin-login:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  let password = '';
  try {
    const body = (await req.json()) as { password?: string };
    password = body.password ?? '';
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });
  }
  if (!(await checkPassword(password))) {
    return NextResponse.json({ ok: false, error: 'wrong_password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionValue(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE
  });
  return res;
}
