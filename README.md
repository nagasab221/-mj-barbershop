# MJ Barbershop — Website

A bilingual (English / العربية) single-page marketing site for a premium UAE barbershop,
with its **own CMS at `/admin`**, running on **Cloudflare Workers + Supabase**.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · next-intl (locale routing +
RTL) · Supabase (Postgres + Storage) · Telegram Bot API (booking notifications) · Cloudflare
Workers via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) (hosting)

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

| Command             | Purpose                                                     |
| ------------------- | ---------------------------------------------------------- |
| `npm run dev`       | Dev server on port 3000                                    |
| `npm run build`     | Standard Next.js production build                          |
| `npm run typecheck` | TypeScript check                                           |
| `npm run lint`      | ESLint                                                     |
| `npm run cf:build`  | Build the Cloudflare Workers bundle (`.open-next/`)        |
| `npm run preview`   | Build + run the Worker locally in workerd (reads `.dev.vars`) |
| `npm run deploy`    | Build + deploy to Cloudflare with Wrangler (`wrangler login` first) |

> Cloudflare's build CI (Linux) is the source of truth for production builds. The
> OpenNext build prints a Windows-compatibility warning locally — harmless for the
> Git-integration deploy below, which builds on Linux.

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

## Deploying to Cloudflare Workers

Cloudflare merged Pages into Workers, so the site deploys as a **Worker** using the
[OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare). The `wrangler.jsonc` in
the repo already configures the worker entry, the static-assets binding, and the required
`nodejs_compat` flag — you only supply environment variables.

### Recommended: Git integration (builds on Cloudflare's Linux CI)

1. Push this repo to GitHub.
2. Cloudflare dashboard → **Workers & Pages → Create → Import a repository** → pick the repo.
3. Build settings:
   - **Project name:** `mj-barbershop`  → your site becomes `mj-barbershop.<subdomain>.workers.dev`
   - **Build command:** `npm run cf:build`
   - **Deploy command:** `npx wrangler deploy` *(the dashboard pre-fills this — correct)*
   - Leave the **root/path** at the repo root (do **not** set it to a build-output folder).
4. **Environment variables** (Settings → Variables and Secrets). Add as **Secret**:
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`,
   `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. Add `NEXT_PUBLIC_SITE_URL` as a **build**
   variable (it's inlined at build time) set to your final URL, e.g.
   `https://mj-barbershop.<subdomain>.workers.dev` or a custom domain.
5. Deploy. Every push to `main` rebuilds automatically; content edits in `/admin` are live
   on the next request (no rebuild needed).

`NEXT_PUBLIC_SITE_URL` only affects SEO/canonical URLs, so if you don't know the final
subdomain yet, deploy once, read the assigned `*.workers.dev` URL, set the variable, and
redeploy.

### Alternative: deploy from your machine with Wrangler

Works on Windows too (the OpenNext build runs locally despite its warning):

```bash
npx wrangler login                # authorize your Cloudflare account (browser)
# set the six runtime secrets once:
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
# build + deploy (NEXT_PUBLIC_SITE_URL is baked in at build time):
NEXT_PUBLIC_SITE_URL="https://mj-barbershop.<subdomain>.workers.dev" npm run deploy
```

`npm run preview` builds and runs the worker locally in workerd, reading secrets from a
gitignored `.dev.vars` file (same `KEY=value` format as `.env.local`).

> **Note on Next.js version:** OpenNext flags Next 14 as past its 2-year support window, so
> the build uses `--dangerouslyUseUnsupportedNextVersion` (already wired into `cf:build`).
> It builds and runs fine; upgrading to Next 15 later removes the flag.

---

## Updating the site

There are two kinds of updates — most day-to-day changes need **no deploy at all**:

**Content changes (prices, hours, copy, images, blocked dates …)**
Log in at `/admin`, edit, hit **Save changes**. Live on the next page load. Nothing else
to do — no git, no rebuild.

**Code changes (design, features, new sections)**
```bash
# after editing the code locally:
npm run typecheck && npm run build   # sanity check
git add -A
git commit -m "Describe the change"
git push
```
The push triggers Cloudflare's build automatically (~2–4 min). Watch it under
**Workers & Pages → mj-barbershop → Deployments**; when it goes green, the site is
updated. To roll back a bad deploy, open Deployments and press **Rollback** on the
previous good one.

**Database changes** (rare — only when a code change says so): run the SQL file the
change ships with (e.g. `supabase/migration-*.sql`) in **Supabase → SQL Editor** *before*
pushing the code.

---

## The CMS (`/admin`)

| Tab                    | Controls                                                                    |
| ---------------------- | --------------------------------------------------------------------------- |
| **Bookings**           | Inbox of reservations — status (new → confirmed → completed / cancelled / no-show), call/WhatsApp the client, delete |
| **Services & Pricing** | Add/remove/reorder packages: name, AED price, duration, category, badge, image |
| **Hours & Dates**      | Booking copy, weekly working hours, blocked dates (Eid, holidays), and **Venue & travel**: studio open/closed toggle (off = mobile-only, studio shows “coming soon”), base area name (no travel fee), and the travel fee (AED) for home visits outside it |
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
   └─ POST /api/reserve  (Worker request handler)
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
wrangler.jsonc            # Cloudflare Workers config (entry, assets, nodejs_compat)
open-next.config.ts       # OpenNext → Cloudflare adapter config
```

### Extending the CMS

Add the field to `SiteContent` in `src/lib/types.ts`, give it a default in
`src/lib/fallback-content.json`, whitelist it in `src/lib/sanitize.ts`, add an input in
`src/components/admin/ContentPanels.tsx`, then render it in the relevant section
component. Bilingual fields use the shared `L` type (`{ en, ar }`).

### Swapping the brand

"MJ" appears in: `Emblem.tsx` (logo mark), `Header`/`Footer` wordmarks, `messages/*.json`
meta, `fallback-content.json`, and `app/icon.svg`. Search for `MJ Barbershop` and replace.
