// Applies all migrations to an in-memory Postgres (PGlite) and runs every *.test.sql file.
// Each '-- TEST:' block runs in its own transaction; titles containing 'EXPECT FAIL' must error.
// Run with:  npm run test:db
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { citext } from '@electric-sql/pglite/contrib/citext';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(here, '..', 'migrations');
const db = new PGlite({ extensions: { citext, pgcrypto } });

// --- minimal stand-ins for what hosted Supabase provides (auth, roles, storage) ---
await db.exec(`
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create or replace function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create or replace function auth.role() returns text language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon') $$;
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean default false,
                                file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(),
                                bucket_id text references storage.buckets(id), name text,
                                owner uuid, created_at timestamptz default now());
  alter table storage.objects enable row level security;
  create or replace function storage.foldername(name text) returns text[] language sql immutable as
    $$ select string_to_array(name, '/') $$;
  -- Supabase's default grants (RLS is what actually restricts access)
  grant usage on schema public, auth, storage to anon, authenticated, service_role;
  grant execute on all functions in schema auth to anon, authenticated, service_role;
  grant all on all tables in schema storage to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`);

for (const f of fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()) {
  try {
    await db.exec(fs.readFileSync(path.join(migrationsDir, f), 'utf8'));
    console.log('migration ok  ', f);
  } catch (e) {
    console.log('migration FAIL', f, '\n  ', e.message);
    process.exit(1);
  }
}

let failed = 0;
for (const testFile of fs.readdirSync(here).filter((f) => f.endsWith('.test.sql')).sort()) {
  console.log('\n#', testFile);
  const sql = fs.readFileSync(path.join(here, testFile), 'utf8');
  for (const block of sql.split(/^-- TEST:/m).slice(1)) {
    const [firstLine, ...rest] = block.split('\n');
    let title = firstLine.trim();
    const expectFail = /EXPECT FAIL/.test(title);
    let ok;
    try {
      await db.exec('begin;\n' + rest.join('\n') + '\n;rollback;');
      ok = !expectFail;
      if (!ok) title += '  → expected an error but it succeeded';
    } catch (e) {
      await db.exec('rollback').catch(() => {});
      ok = expectFail;
      title += (ok ? '  ✓ blocked: ' : '  → ') + e.message;   // show WHY it failed, so a typo can't pass as "blocked"
    }
    if (!ok) failed++;
    console.log(ok ? '  pass' : '  FAIL', title);
  }
}
console.log(failed ? `\n${failed} test(s) failed` : '\nall tests passed');
await db.close();
process.exitCode = failed ? 1 : 0;
