# MJ Barbershop — Website

A bilingual (English / العربية) single-page marketing site for a premium UAE barbershop,
with its **own CMS at `/admin`**, running on **Cloudflare Pages + Supabase**.

**Stack:** Next.js 14 (App Router, Edge runtime) · TypeScript · Tailwind CSS · next-intl
(locale routing + RTL) · Supabase (Postgres + Storage) · Telegram Bot API (booking
notifications) · Cloudflare Pages (hosting)

---

## Quick start (local)

```bash
npm install
npm run dev
```

- Site: http://localhost:3000 (redirects to `/en`; Arabic at `/ar`, full RTL)
- CMS: http://localhost:3000/admin — password is `ADMIN_PASSWORD` in `.env.local`

Without Supabase credentials the site runs in **demo mode**: the public pages serve the
built-in starter content and `/admin` shows setup instructions. Connect Supabase (below)
to unlock editing and the bookings inbox — locally and in production alike.

### Scripts

| Command               | Purpose                                             |
| --------------------- | --------------------------------------------------- |
| `npm run dev`         | Dev server on port 3000                             |
| `npm run build`       | Standard Next.js production build                   |
| `npm run typecheck`   | TypeScript check                                    |
| `npm run lint`        | ESLint                                              |
| `npm run pages:build` | Build the Cloudflare Pages artifact (Linux/WSL/CI)  |
| `npm run pages:deploy`| Build + deploy with Wrangler (needs `wrangler login`) |

> `pages:build` does not run on plain Windows (the adapter spawns Unix-style processes
> and needs symlinks). That's fine — Cloudflare's build CI runs it on Linux for you.

---

## Connecting Supabase (one-time, ~5 minutes)

1. Create a free project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and **Run**. This creates:
   - `site_content` — one JSON row with all editable content (auto-seeded on first load)
   - `reservations` — the bookings inbox
   - a public `uploads` storage bucket for gallery/service images
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
4. Put both in `.env.local` (locally) and in Cloudflare Pages env vars (production).
5. Restart / redeploy. Open `/admin`, sign in, edit away.

**Security model:** the browser never talks to Supabase. All reads/writes happen
server-side with the service-role key; both tables have RLS enabled with no public
policies, so the anon key can't read anything (including customers' phone numbers).

---

## Environment variables

| Variable                    | Required          | Purpose                                              |
| --------------------------- | ----------------- | ---------------------------------------------------- |
| `SUPABASE_URL`              | yes (for CMS)     | Supabase Project URL                                 |
| `SUPABASE_SERVICE_ROLE_KEY` | yes (for CMS)     | Service-role key — server-side only                  |
| `ADMIN_PASSWORD`            | yes               | Password for `/admin`                                |
| `ADMIN_SESSION_SECRET`      | yes               | Long random string signing the admin session cookie  |
| `TELEGRAM_BOT_TOKEN`        | for notifications | Bot token from [@BotFather](https://t.me/BotFather)  |
| `TELEGRAM_CHAT_ID`          | for notifications | Your chat id (e.g. from [@userinfobot](https://t.me/userinfobot)) |
| `NEXT_PUBLIC_SITE_URL`      | for SEO           | Public URL of the deployed site (build-time)         |

> **Telegram:** open your bot in Telegram and press **Start** once, otherwise Telegram
> refuses to deliver messages ("chat not found"). Consider rotating the token via
> @BotFather if it has ever been shared in plain text.

---

## Deploying to Cloudflare Pages with Wrangler

> **The build step needs a Unix-like OS.** `@cloudflare/next-on-pages` shells out to
> `vercel build` and creates symlinks, which don't work on native Windows. Run the
> `pages:build` + `wrangler deploy` steps from **macOS, Linux, or WSL**. On Windows,
> install WSL once with `wsl --install` (then work inside the Ubuntu shell), or use the
> Git-integration path at the bottom (Cloudflare builds it on their Linux CI — no local
> Unix needed).

### 1. One-time: authenticate & create the project

```bash
npm install -g wrangler          # or use `npx wrangler ...` everywhere
wrangler login                   # opens a browser to authorize your Cloudflare account
wrangler pages project create mj-barbershop --production-branch main
```

### 2. One-time: set the runtime secrets on the project

These are read by the Edge functions at runtime (values are prompted, not echoed):

```bash
wrangler pages secret put SUPABASE_URL              --project-name mj-barbershop
wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY --project-name mj-barbershop
wrangler pages secret put ADMIN_PASSWORD            --project-name mj-barbershop
wrangler pages secret put ADMIN_SESSION_SECRET      --project-name mj-barbershop
wrangler pages secret put TELEGRAM_BOT_TOKEN        --project-name mj-barbershop
wrangler pages secret put TELEGRAM_CHAT_ID          --project-name mj-barbershop
```

`nodejs_compat` is already supplied by `wrangler.toml`. (If a route ever errors with a
Node API message, add the `nodejs_compat` flag under Pages → Settings → Functions in the
dashboard for both Production and Preview.)

### 3. Build & deploy (repeat for each release)

`NEXT_PUBLIC_SITE_URL` is inlined at **build time**, so export it before building:

```bash
export NEXT_PUBLIC_SITE_URL="https://mj-barbershop.pages.dev"   # or your custom domain
npm install
npm run pages:build            # → produces .vercel/output/static
wrangler pages deploy .vercel/output/static --project-name mj-barbershop
```

That's it — every page and API route runs as an Edge function, and content edits in
`/admin` are live on the next request (no rebuild needed). To ship code changes later,
re-run step 3.

### Alternative: Git integration (no local Unix required)

Push the repo to GitHub, then in the Cloudflare dashboard: **Workers & Pages → Create →
Pages → Connect to Git**. Set **Build command** `npx @cloudflare/next-on-pages@1.13.15`,
**Output directory** `.vercel/output/static`, add all the environment variables from the
table above (including `NEXT_PUBLIC_SITE_URL`), and deploy. Cloudflare's Linux CI runs the
build for you on every push.

---

## The CMS (`/admin`)

| Tab                    | Controls                                                                    |
| ---------------------- | --------------------------------------------------------------------------- |
| **Bookings**           | Inbox of reservations — status (new → confirmed → completed / cancelled / no-show), call/WhatsApp the client, delete |
| **Services & Pricing** | Add/remove/reorder packages: name, AED price, duration, category, badge, image |
| **Hours & Dates**      | Booking copy, weekly working hours, blocked dates (Eid, holidays)           |
| **Site Copy**          | Hero, tagline, about story, founder bio, stats, phone/WhatsApp/email/socials |
| **Location**           | Address, display hours, map coordinates                                     |
| **Gallery**            | Upload images (JPG/PNG/WebP ≤ 8 MB → Supabase Storage) with bilingual captions |
| **Testimonials**       | Reviews with star ratings                                                    |

Every user-facing string has an **English** and an **Arabic** field. Login is
rate-limited, password-checked in constant time (Web Crypto), and sessions are
HMAC-signed HttpOnly cookies (7 days).

---

## How bookings work

```
Booking form (/en or /ar)
   └─ POST /api/reserve  (Edge function)
        ├─ validates name, UAE phone (05x…), service, date & time
        │    · slots come from working hours + blocked dates set in /admin
        │    · same-day bookings need ≥ 1h lead time; horizon = 90 days
        ├─ inserts into Supabase `reservations`  → /admin “Bookings” tab
        ├─ sends a Telegram message to the owner (if bot configured)
        └─ returns a booking reference (e.g. MJ-7K2FQ) shown to the client
```

Spam protection: honeypot field + per-IP rate limit (best-effort per edge isolate).
The contact form posts to `/api/contact` (Telegram only, not stored).

---

## Project layout

```
src/
  app/
    (site)/[locale]/      # the localized landing page (en / ar) — edge, dynamic
    (admin)/admin/        # the CMS dashboard (login + panels) — edge, dynamic
    api/reserve/          # booking endpoint (Supabase + Telegram)
    api/contact/          # contact form endpoint (Telegram)
    api/admin/*           # CMS endpoints (login, content, reservations, upload)
  components/             # page sections & UI primitives
  components/admin/       # CMS dashboard components
  i18n/                   # next-intl routing/request config
  lib/                    # types, supabase client, data layer, auth, booking rules
messages/                 # UI strings (en.json / ar.json)
public/gallery/           # placeholder artwork (replace via /admin → Gallery)
supabase/schema.sql       # one-time database setup
wrangler.toml             # Cloudflare Pages config (nodejs_compat)
```

### Extending the CMS

Add the field to `SiteContent` in `src/lib/types.ts`, give it a default in
`src/lib/fallback-content.json`, whitelist it in `src/lib/sanitize.ts`, add an input in
`src/components/admin/ContentPanels.tsx`, then render it in the relevant section
component. Bilingual fields use the shared `L` type (`{ en, ar }`).

### Swapping the brand

"MJ" appears in: `Emblem.tsx` (logo mark), `Header`/`Footer` wordmarks, `messages/*.json`
meta, `fallback-content.json`, and `app/icon.svg`. Search for `MJ Barbershop` and replace.
