import { NextResponse, type NextRequest } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { supabase, supabaseConfigured, uploadsPublicPrefix } from '@/lib/supabase';

export const runtime = 'edge';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

/** Uploads an image to the public `uploads` bucket and returns its CDN URL. */
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_form' }, { status: 400 });
  }

  // Avoid `instanceof File`: the edge runtime's multipart parser can return a
  // Blob-like value whose constructor differs from the sandbox's File global,
  // so instanceof yields false negatives. Ruling out string/null is enough —
  // the remaining value is a File with arrayBuffer()/name/type/size.
  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ ok: false, error: 'no_file' }, { status: 400 });
  }

  const ext = EXT_BY_MIME[file.type];
  if (!ext) {
    return NextResponse.json({ ok: false, error: 'unsupported_type' }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: 'too_large' }, { status: 413 });
  }

  const base =
    file.name
      .replace(/\.[^.]*$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'image';
  const filename = `${Date.now()}-${base}.${ext}`;

  const { error } = await supabase()
    .storage.from('uploads')
    .upload(filename, await file.arrayBuffer(), { contentType: file.type, upsert: false });
  if (error) {
    console.error('[admin] storage upload failed:', error.message);
    return NextResponse.json({ ok: false, error: 'upload_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, path: `${uploadsPublicPrefix()}${filename}` });
}
