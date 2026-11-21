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

## Status
- [x] Phase 1.1 — project setup
- [x] 1.2 — database schema (+ automated tests)
- [ ] 1.3 security rules · 1.4 admin login & password reset
- [ ] Phase 2 website · Phase 3 admin panel · Phase 4 testing

## License
MIT
