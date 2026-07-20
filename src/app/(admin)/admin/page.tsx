import { isAdminRequest } from '@/lib/auth';
import { getContent, supabaseConfigured } from '@/lib/db';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminDashboard from '@/components/admin/AdminDashboard';

// Auth + live content on every request, never cached.
export const dynamic = 'force-dynamic';

/** Shown until Supabase credentials are configured. */
function SupabaseSetupNotice() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 pinstripes-light">
      <div className="max-w-xl border border-cream/10 bg-cream/[0.02] p-10">
        <p className="text-[11px] font-semibold uppercase tracking-luxe text-brass">MJ Barbershop</p>
        <h1 className="mt-3 font-display text-3xl">Connect Supabase to unlock the CMS</h1>
        <p className="mt-4 text-sm leading-relaxed text-cream/70">
          The public site is running in demo mode with built-in content. To edit content and
          receive bookings here, connect a free Supabase project:
        </p>
        <ol className="mt-4 list-decimal space-y-2 ps-5 text-sm leading-relaxed text-cream/70">
          <li>
            Create a project at <span className="text-cream">supabase.com/dashboard</span>
          </li>
          <li>
            Open the SQL Editor and run the contents of <code className="text-brass">supabase/schema.sql</code>
          </li>
          <li>
            Copy <code className="text-brass">SUPABASE_URL</code> and{' '}
            <code className="text-brass">SUPABASE_SERVICE_ROLE_KEY</code> from Project Settings → API
            into <code className="text-brass">.env.local</code> (locally) or the Cloudflare Pages
            environment variables (in production)
          </li>
          <li>Restart / redeploy, then reload this page</li>
        </ol>
        <p className="mt-5 text-xs text-cream/40">
          Full walkthrough in the project README → “Connecting Supabase”.
        </p>
      </div>
    </main>
  );
}

export default async function AdminPage() {
  if (!supabaseConfigured()) return <SupabaseSetupNotice />;
  if (!(await isAdminRequest())) return <AdminLogin />;
  const content = await getContent();
  return <AdminDashboard initialContent={content} />;
}
