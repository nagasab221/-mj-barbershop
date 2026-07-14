/**
 * Server-side Supabase access. The site talks to Supabase exclusively with
 * the service-role key from route handlers and server components — the
 * browser never sees a Supabase credential, and the tables carry RLS with
 * no public policies.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function supabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

let cached: SupabaseClient | null = null;

/** Lazily created (env vars are injected per-request on Cloudflare). */
export function supabase(): SupabaseClient {
  if (!cached) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
    }
    cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return cached;
}

/** Public URL prefix of the `uploads` storage bucket (empty when unconfigured). */
export function uploadsPublicPrefix(): string {
  const url = process.env.SUPABASE_URL;
  return url ? `${url.replace(/\/+$/, '')}/storage/v1/object/public/uploads/` : '';
}
