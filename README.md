# Marketing Portfolio — template

A generic portfolio template for digital-marketing freelancers: a **public website** plus a **separate admin panel** where the owner edits everything (hero, results, case studies, services, testimonials, FAQ, settings) and reads contact-form messages. Powered by **Next.js + Tailwind + Supabase**, deployable on **Vercel** with a custom domain.

> This repo contains **placeholder content only**. A real person's data lives in their own private deployment/database.

## Structure
```
apps/web     public website            → yourdomain.com
apps/admin   admin panel (login)       → admin.yourdomain.com
```

## Getting started
```bash
npm install
cp .env.example apps/web/.env.local     # then fill in
cp .env.example apps/admin/.env.local
npm run dev:web     # http://localhost:3000
npm run dev:admin   # http://localhost:3001
```

## Database (Supabase / Postgres)
Schema lives in [`supabase/migrations/`](supabase/migrations/). Every website section maps to a table the admin panel edits.

| Table | Drives | Notes |
|---|---|---|
| `profile` | Hero, logo initials, About text | single row |
| `site_settings` | Contact info, socials, SEO, Meta Pixel / GA4, theme colours, section on/off, form budget options | single row |
| `stats` | Results band (+ floating hero cards via `show_in_hero`) | value / prefix / suffix / decimals |
| `brands`, `certifications` | Logo marquee, certification badges | |
| `case_studies` + `case_study_images` | Case-study cards and `/work/[slug]` pages | draft/published, card colour, KPI, mini-chart (`visual_type` + `visual_data`), metrics |
| `testimonials` | Quote cards (optionally linked to a case study) | |
| `services`, `process_steps`, `tools`, `about_facts`, `faqs` | Matching sections | all have `sort_order` + `is_visible` |
| `contact_messages` | Admin inbox (consultation form) | status new/read/replied/archived/spam, phone **or** email required |
| `admins` | Who may log in to the admin panel | no public sign-up |

Validation is enforced in the database (hex colours, slugs, URLs, emails, WhatsApp digits, GA4/Pixel IDs, length limits).

```bash
npm run test:db     # applies all migrations to an in-memory Postgres and runs supabase/tests/*.test.sql
```

## Security model
Row Level Security is on for every table ([`supabase/migrations/…_security.sql`](supabase/migrations/)).

| Who | Can |
|---|---|
| Visitor | Read visible / published content. Send the contact form **only** via `submit_contact_message()` (rate-limited: 5/hour per device, 30/10 min site-wide). Cannot read the inbox, write any table, list uploaded files, or see drafts. |
| Signed-in user who is **not** in `admins` | Exactly the same as a visitor. |
| Admin | Read and edit all content, manage the inbox, upload images to the `media` bucket. Cannot add other admins or truncate tables. |

- Admins are added **only** from the Supabase SQL editor — there is no API path to become one.
- `media` bucket: public URLs, admin-only upload, images only (no SVG), 5 MB max.
- Covered by 32 automated tests in `supabase/tests/02_security.test.sql`.

### Hosted Supabase checklist (do once per project)
`supabase/config.toml` sets these for local dev; on supabase.com set the same under **Authentication → Settings**:
- [ ] **Allow new users to sign up: OFF**
- [ ] Minimum password length **10**, require **lowercase, uppercase and digits**
- [ ] **Secure password change: ON**
- [ ] Site URL = your admin URL (e.g. `https://admin.yourdomain.com`), and add it to Redirect URLs
- [ ] Create the admin user (Authentication → Users → Add user), then in the SQL editor:
  `insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';`

## Admin login
`apps/admin`: sign in · forgot password (email link) · set new password · change password (needs current password).
Protected three times: `src/proxy.ts` (redirect if signed out) → `requireAdmin()` in every page/action (checks `is_admin()`) → database RLS.

**Recommended:** in Supabase → Authentication → Emails → *Reset Password*, set the link to
`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`
so reset links work on any device (the default link only works in the same browser).

## SEO & tracking (apps/web)
- Titles, descriptions and the share image come from `site_settings` / `profile`; a branded share image and the browser-tab icon are generated automatically when none is uploaded.
- `sitemap.xml` (home + published case studies) and `robots.txt` are generated; structured data (Person, WebSite, Article) is on every page; `/privacy` is included.
- **Set `NEXT_PUBLIC_SITE_URL` to your real domain** (e.g. `https://yourdomain.com`) so canonical links, the sitemap and share previews use it.
- Meta Pixel / GA4: enter the IDs in `site_settings` (`meta_pixel_id`, `ga4_id`). Nothing loads until an ID is set; visitors with Do Not Track are skipped. The consultation form fires `Lead` / `generate_lead`.

## Status
- [x] Phase 1.1 — project setup
- [x] 1.2 — database schema (+ automated tests)
- [x] 1.3 — security rules (+ automated tests)
- [x] 1.4 — admin login, forgot password, change password
- [x] 1.5 — placeholder demo content (`supabase/seed/demo_content.sql`)
- [x] 2.1 design system · [x] 2.2 home page sections
- [x] 2.3 case-study pages
- [x] 2.4 consultation form + WhatsApp
- [x] 2.5 responsive + animation polish (tested at 17 screen sizes, 280-3840px)
- [x] 2.6 SEO & tracking
- Theme: Navy base + Emerald accent (`#10B981`, actions/structure) + a second "highlight" colour (numbers/emphasis; emerald by default, can be any colour). Colours live in `site_settings` (`color_primary`, `color_accent`, `color_highlight`) — change them and the whole site follows; text colour on accent fills is picked by contrast.
- [ ] Phase 3 admin panel · Phase 4 testing

## License
MIT
