import { NextResponse, type NextRequest } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { getContent, saveContent, supabaseConfigured } from '@/lib/db';
import { sanitizeContent } from '@/lib/sanitize';

function unauthorized() {
  return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
}

export async function GET() {
  if (!(await isAdminRequest())) return unauthorized();
  return NextResponse.json({ ok: true, content: await getContent() });
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminRequest())) return unauthorized();
  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });
  }

  let body: { content?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const clean = sanitizeContent(body.content);
  // Refuse saves that would wipe the services list by accident.
  if (clean.packages.length === 0) {
    return NextResponse.json({ ok: false, error: 'no_packages' }, { status: 400 });
  }

  try {
    await saveContent(clean);
  } catch (err) {
    console.error('[admin] saveContent failed:', err);
    return NextResponse.json({ ok: false, error: 'save_failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, content: clean });
}
