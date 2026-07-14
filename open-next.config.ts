import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Default OpenNext → Cloudflare Workers config. No incremental cache / queue
// is configured because the site reads its content from Supabase on every
// request (pages are force-dynamic), so there's nothing to cache here.
export default defineCloudflareConfig();
