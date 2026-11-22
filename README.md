# Marketing Portfolio — template

A generic portfolio template for digital-marketing freelancers: a **public website** plus a **separate admin panel** where the owner edits everything (hero, results, case studies, services, testimonials, FAQ, settings) and reads contact-form messages. Built with **Next.js + Tailwind + Supabase**, deployable on **Vercel** with a custom domain.

> This repo contains **placeholder content only**. A real person's data lives in their own private deployment and database. Never commit real content, photos, keys or `.env*` files.

## What you get

| App | Address (example) | For |
|---|---|---|
| `apps/web` | `https://yourdomain.com` | Visitors: home page, case studies, privacy page, consultation form |
| `apps/admin` | `https://admin.yourdomain.com` | The owner: edit content, upload images, read the inbox |

## Requirements

- **Node.js 20 or newer** (`node -v`)
- A free **Supabase** project (https://supabase.com)
- Optional: a free **Resend** account (email alerts and password-reset emails)
- Optional: the **Supabase CLI** (`npx supabase`) to push database changes from this repo

## Setup (about 20 minutes)

### 1. Install

```bash
npm install
```

### 2. Create the database

1. In Supabase, create a project and note its URL and **publishable (anon) key** under *Project Settings → API*.
2. Apply the database schema. Either:
   - **With the CLI:** `npx supabase link --project-ref YOUR-PROJECT-REF`, then `npx supabase db push --remote`, or
   - **By hand:** open the SQL editor and run the files in `supabase/migrations/` in order (oldest first).
3. Optional sample content: run `supabase/seed/demo_content.sql` in the SQL editor. Skip this on a live site.

### 3. Configure the environment

Copy the example file into both apps and fill it in:

```bash
cp .env.example apps/web/.env.local
cp .env.example apps/admin/.env.local
```

| Variable | Used by | What to put |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | both | Your project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | both | The publishable (anon) key. **Never** the `service_role` / secret key |
| `NEXT_PUBLIC_SITE_URL` | both | Public website address, e.g. `https://yourdomain.com` (use `http://localhost:3000` locally) |
| `NEXT_PUBLIC_ADMIN_URL` | both | Admin address, e.g. `https://admin.yourdomain.com` (use `http://localhost:3001` locally) |
| `RESEND_API_KEY` | web | Optional. Turns on email alerts for new messages |
| `CONTACT_NOTIFY_EMAIL` | web | Where alerts go (up to 3 addresses, comma-separated) |
| `RESEND_FROM` | web | Optional sender, e.g. `Website <hello@yourdomain.com>` (needs a verified domain) |
| `CONTACT_HASH_SALT` | web | A long random string. Used to hash visitor IPs for rate limiting |
| `AUTH_HASH_SALT` | admin | A long random string. Used to hash visitor IPs for the sign-in limit |

Generate the salts with `openssl rand -hex 32` (or any long random text). Keep them secret and different from each other.

Environment files are gitignored. Do not commit them.

### 4. Create the admin account

1. In Supabase, go to *Authentication → Users → Add user* and create the owner's user with an email and a strong password.
2. In the SQL editor, make that user an admin (this is the only way to add one; there is no API path):

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```

### 5. Run it locally

```bash
npm run dev:web     # website  → http://localhost:3000
npm run dev:admin   # admin    → http://localhost:3001
```

Sign in at http://localhost:3001/login and edit the content. Changes appear on the website within about a minute.

## Hosted Supabase checklist (once per project)

Set these on supabase.com (the local `supabase/config.toml` only covers local development):

- [ ] **Authentication → Sign In / Providers → Allow new users to sign up: OFF**
- [ ] **Authentication → Settings:** minimum password length **10**; require lowercase, uppercase and digits
- [ ] **Secure password change: ON**
- [ ] **Authentication → URL Configuration:** Site URL = your admin address (e.g. `https://admin.yourdomain.com`), and add the same address to Redirect URLs
- [ ] **Authentication → Emails → Reset Password:** use this link so reset emails work on any device:
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`
- [ ] **Email delivery:** Supabase's built-in email is rate limited. Connect Resend (*Project Settings → Authentication → SMTP*) before going live, or reset emails may not arrive

## Database

The schema lives in [`supabase/migrations/`](supabase/migrations/). Every website section maps to a table the admin edits.

| Table | Drives | Notes |
|---|---|---|
| `profile` | Hero, logo initials, About text | single row |
| `site_settings` | Contact info, socials, SEO, Meta Pixel / GA4, theme colours, form budget options | single row |
| `stats` | Results band (+ hero cards via `show_in_hero`) | value / prefix / suffix / decimals |
| `brands`, `certifications` | Logo marquee, certification badges | |
| `case_studies` + `case_study_images` | Case-study cards and `/work/[slug]` pages | draft / published, card colour, KPI, chart, metrics, screenshots |
| `testimonials` | Quote cards (optionally linked to a case study) | |
| `services`, `process_steps`, `tools`, `about_facts`, `faqs` | Matching sections | `sort_order` + `is_visible` |
| `contact_messages` | Admin inbox (consultation form) | new / read / replied / archived / spam; phone **or** email required |
| `admins` | Who may sign in to the admin | no public sign-up |
| `login_attempts` | Sign-in and reset rate limit | internal; cleared daily |

Validation is enforced in the database too: hex colours, slugs, web addresses (http/https only), emails, WhatsApp digits, GA4 and Pixel IDs, and length limits.

## Security model

Row Level Security is on for every table.

| Who | Can |
|---|---|
| Visitor | Read visible / published content. Send the consultation form only through `submit_contact_message()` (5 per hour per device, 30 per 10 minutes site-wide). Cannot read the inbox, write any table, list uploaded files or see drafts. |
| Signed-in user who is **not** an admin | Exactly the same as a visitor. |
| Admin | Read and edit all content, upload images, manage the inbox (status and private notes only; message text and contact details are locked). Cannot add admins or truncate tables. |

- **Sign-in limit:** 10 sign-in or reset attempts per 15 minutes per device. Only a salted hash of the IP is stored.
- **Reset links:** "set new password" works only within 1 hour of opening a reset email. Signed-in users change their password in *Settings → Password* with the current one.
- **Uploads:** `media` bucket, public URLs, admin-only upload, images only (no SVG), 5 MB max.
- **Headers:** Content-Security-Policy, HSTS, frame blocking and referrer policy are set on both apps. The admin cannot be embedded in another site, and it is marked as not for search engines.
- Automated tests for all of the above live in `supabase/tests/`.

## Tests

```bash
npm run test:db     # database: applies all migrations to an in-memory Postgres and runs supabase/tests/*.test.sql
npm test            # everything: database, website and admin unit tests
npm run lint
npm run typecheck
```

## Deploying (Vercel)

1. Push the repo to GitHub, then *Vercel → Add New → Project* and import it.
2. Create **two projects** from the same repo, one per app:
   - **Website:** Root Directory `apps/web`
   - **Admin:** Root Directory `apps/admin`
3. Add the environment variables from step 3 to each project. Use `https://` addresses.
4. Add the domains: the website on `yourdomain.com`, the admin on `admin.yourdomain.com`. Make sure `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_ADMIN_URL` match.
5. Redeploy after any change to environment variables.

Changing a domain later needs no code changes: update the two URL variables and the Supabase URL settings.

## SEO and tracking (website)

- Titles, descriptions and the share image come from `site_settings` and `profile`. A branded share image and the browser-tab icon are generated automatically when none is uploaded.
- `sitemap.xml` (home page and published case studies) and `robots.txt` are generated. Structured data is on every page, and `/privacy` is included.
- **Set `NEXT_PUBLIC_SITE_URL` to the real domain** so canonical links, the sitemap and share previews use it.
- Meta Pixel and GA4: enter the IDs in `site_settings`. Nothing loads until an ID is set, and visitors with Do Not Track are skipped. The consultation form fires `Lead` and `generate_lead` events.

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| "Missing environment variable" on start | Copy `.env.example` to `apps/*/.env.local` and fill in the values. Restart the dev server. |
| Admin sign-in says "Incorrect email or password" for a correct password | Check the user exists under Authentication → Users and is in `public.admins`. |
| "Too many attempts from this device" | Wait 15 minutes. The limit is per device. |
| Reset email never arrives | Connect Resend as the SMTP sender in Supabase (see the checklist). Check spam. |
| Reset link says "expired" | Links last 1 hour and work once. Request a new one. |
| Website changes don't appear | Wait about a minute (the site caches for a short time), then refresh. |
| Email alerts don't arrive | Check `RESEND_API_KEY`, and that `CONTACT_NOTIFY_EMAIL` is the email your Resend account was created with until your domain is verified. The message still appears in the admin inbox. |

## Status

- [x] Phase 1 — foundation: database, security rules, admin sign-in, sample content
- [x] Phase 2 — public website: design, sections, case-study pages, consultation form, responsive design, SEO and tracking
- [x] Phase 3 — admin panel: content editing, drag-to-reorder, image uploads, inbox and email alerts
- [x] Phase 4 — testing and security review
- [ ] Phase 5 — deployment to Vercel
- [ ] Phase 6 — custom domain

Theme: navy base with an emerald accent (`#10B981`) and a second "highlight" colour. All colours live in `site_settings` (`color_primary`, `color_accent`, `color_highlight`). Change them and the site follows; text on coloured fills is chosen for contrast automatically.

## License

MIT
