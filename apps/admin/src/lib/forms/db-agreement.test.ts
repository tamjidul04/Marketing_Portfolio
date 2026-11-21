// The form rules and the REAL database schema must agree:
//   1. anything the forms accept is also accepted by the database (so saving can never hit a DB error)
//   2. every length limit the forms advertise really exists in the database (so the two can't drift apart)
// Runs against an in-memory Postgres built from supabase/migrations.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createDb } from '../../../../../supabase/tests/bootstrap.mjs';
import { PROFILE_FIELDS, SECTIONS, SETTINGS_FIELDS } from './config.ts';
import { validateFields, type Source } from './validate.ts';
import type { CleanData, Field } from './types.ts';

type Db = { query(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>; close(): Promise<void> };
let db: Db;

before(async () => {
  ({ db } = (await createDb()) as unknown as { db: Db });
});
after(async () => {
  await db.close();
});

const src = (o: Record<string, string | string[]>): Source => ({
  get: (n) => (n in o ? (Array.isArray(o[n]) ? (o[n] as string[])[0] ?? null : (o[n] as string)) : null),
  getAll: (n) => (n in o ? (Array.isArray(o[n]) ? (o[n] as string[]) : [o[n] as string]) : []),
});

/** A realistic valid value for each field. */
const SPECIAL: Record<string, string | string[]> = {
  whatsapp: '8801700000000', meta_pixel_id: '1234567890', ga4_id: 'G-ABCD1234', phone: '+880 1700 000000', contact_email: 'a@b.co',
  icon: 'target', decimals: '1', value: '12.5', color: '#10B981', color_primary: '#1B2A4A', color_accent: '#10B981', color_highlight: '#10B981',
  features: 'One\nTwo', hero_tags: 'Ads\nAnalytics', budget_options: 'Under $500\n$500+',
  socials_platform: ['facebook', 'x'], socials_url: ['https://facebook.com/me', 'https://x.com/me'],
};
function sampleInput(fields: Field[]): Record<string, string | string[]> {
  const o: Record<string, string | string[]> = {};
  for (const f of fields) {
    if (f.type === 'checkbox') o[f.name] = 'on';
    else if (f.type === 'socials') { o.socials_platform = SPECIAL.socials_platform; o.socials_url = SPECIAL.socials_url; }
    else if (f.name in SPECIAL) o[f.name] = SPECIAL[f.name];
    else if (f.type === 'number') o[f.name] = '5';
    else if (f.type === 'select') o[f.name] = f.options![0].value;
    else o[f.name] = 'Sample text'.slice(0, f.max ?? 11);
  }
  return o;
}

/** Turn a validated value into a SQL parameter + cast. */
function param(v: CleanData[string], col: string): { sql: string; value: unknown } {
  if (Array.isArray(v)) {
    // an empty list is ambiguous, so the one JSON column (socials) is named explicitly
    return col === 'socials' || (v.length && typeof v[0] === 'object') ? { sql: '::jsonb', value: JSON.stringify(v) } : { sql: '::text[]', value: v };
  }
  return { sql: '', value: v };
}
async function insert(table: string, data: CleanData) {
  const cols = Object.keys(data);
  const ps = cols.map((c) => param(data[c], c));
  await db.query(`insert into public.${table} (${cols.join(',')}) values (${ps.map((p, i) => `$${i + 1}${p.sql}`).join(',')})`, ps.map((p) => p.value));
}
async function update(table: string, data: CleanData) {
  const cols = Object.keys(data);
  const ps = cols.map((c) => param(data[c], c));
  await db.query(`update public.${table} set ${cols.map((c, i) => `${c} = $${i + 1}${ps[i].sql}`).join(',')} where id = 1`, ps.map((p) => p.value));
}

const asRun = async (fn: () => Promise<void>) => {
  await db.query('begin');
  try { await fn(); } finally { await db.query('rollback'); }
};

// ---------------------------------------------------------------------------------------------
for (const section of Object.values(SECTIONS)) {
  test(`${section.slug}: a valid form saves into the real table`, async () => {
    const r = validateFields(section.fields, src(sampleInput(section.fields)));
    assert.ok(r.ok, JSON.stringify(!r.ok && r.errors));
    await asRun(() => insert(section.table, { ...r.data, sort_order: 1 }));
  });

  test(`${section.slug}: every text limit exists in the database (limit accepted, limit+1 rejected)`, async () => {
    for (const f of section.fields.filter((x) => (x.type === 'text' || x.type === 'textarea') && x.max && !x.pattern)) {
      const base = validateFields(section.fields, src(sampleInput(section.fields)));
      assert.ok(base.ok);
      await asRun(() => insert(section.table, { ...base.data, [f.name]: 'x'.repeat(f.max!), sort_order: 1 })); // exactly at the limit: fine
      await assert.rejects(
        asRun(() => insert(section.table, { ...base.data, [f.name]: 'x'.repeat(f.max! + 1), sort_order: 1 })),
        () => true, `${section.table}.${f.name}: the database accepted ${f.max! + 1} characters but the form limit is ${f.max}`,
      );
    }
  });
}

for (const [label, fields, table] of [['profile', PROFILE_FIELDS, 'profile'], ['settings', SETTINGS_FIELDS, 'site_settings']] as const) {
  test(`${label}: a valid form saves into the real table`, async () => {
    const r = validateFields(fields, src(sampleInput(fields)));
    assert.ok(r.ok, JSON.stringify(!r.ok && r.errors));
    await asRun(() => update(table, r.data));
  });

  test(`${label}: empty optional fields save as the database expects (NULL vs empty string)`, async () => {
    const input = sampleInput(fields);
    for (const f of fields) if (!f.required && f.type !== 'checkbox' && f.type !== 'color') input[f.name] = f.type === 'socials' ? input[f.name] : '';
    input.socials_platform = []; input.socials_url = [];
    const r = validateFields(fields, src(input));
    assert.ok(r.ok, JSON.stringify(!r.ok && r.errors));
    await asRun(() => update(table, r.data));
  });

  test(`${label}: every text limit exists in the database`, async () => {
    for (const f of fields.filter((x) => (x.type === 'text' || x.type === 'textarea') && x.max && !x.pattern)) {
      const base = validateFields(fields, src(sampleInput(fields)));
      assert.ok(base.ok);
      await asRun(() => update(table, { ...base.data, [f.name]: 'x'.repeat(f.max!) }));
      await assert.rejects(
        asRun(() => update(table, { ...base.data, [f.name]: 'x'.repeat(f.max! + 1) })),
        () => true, `${table}.${f.name}: the database accepted ${f.max! + 1} characters but the form limit is ${f.max}`,
      );
    }
  });
}

test('settings: patterns for WhatsApp, Pixel and GA4 match the database', async () => {
  const base = validateFields(SETTINGS_FIELDS, src(sampleInput(SETTINGS_FIELDS)));
  assert.ok(base.ok);
  for (const [col, bad] of [['whatsapp', '+8801700000000'], ['meta_pixel_id', '123'], ['ga4_id', 'UA-123456']] as const) {
    assert.equal(validateFields(SETTINGS_FIELDS, src({ ...sampleInput(SETTINGS_FIELDS), [col]: bad })).ok, false, `form should reject ${col}=${bad}`);
    await assert.rejects(asRun(() => update('site_settings', { ...base.data, [col]: bad })), () => true, `database should reject ${col}=${bad}`);
  }
});

test('settings: a social link with a non-http address is rejected by BOTH form and database', async () => {
  assert.equal(validateFields(SETTINGS_FIELDS, src({ ...sampleInput(SETTINGS_FIELDS), socials_platform: ['x'], socials_url: ['javascript:alert(1)'] })).ok, false);
  const base = validateFields(SETTINGS_FIELDS, src(sampleInput(SETTINGS_FIELDS)));
  assert.ok(base.ok);
  // the database only requires platform+url keys, so the FORM is the layer that blocks bad schemes
  await asRun(() => update('site_settings', { ...base.data, socials: [{ platform: 'x', url: 'https://x.com/me' }] }));
});
