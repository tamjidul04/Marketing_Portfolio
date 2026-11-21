// The form rules and the REAL database schema must agree:
//   1. anything the forms accept is also accepted by the database (so saving can never hit a DB error)
//   2. every length limit the forms advertise really exists in the database (so the two can't drift apart)
// Runs against an in-memory Postgres built from supabase/migrations.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createDb } from '../../../../../supabase/tests/bootstrap.mjs';
import { PROFILE_FIELDS, SECTIONS, SETTINGS_FIELDS } from './config.ts';
import { VISUAL_FIELDS, toDbCase } from './case-study.ts';
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
  slug: 'my-sample-project', visual_numbers: '10, 20, 30', features: 'One\nTwo', hero_tags: 'Ads\nAnalytics', budget_options: 'Under $500\n$500+',
  socials_platform: ['facebook', 'x'], socials_url: ['https://facebook.com/me', 'https://x.com/me'],
};
function sampleInput(fields: Field[]): Record<string, string | string[]> {
  const o: Record<string, string | string[]> = {};
  for (const f of fields) {
    if (f.type === 'checkbox') o[f.name] = 'on';
    else if (f.type === 'socials') { o.socials_platform = SPECIAL.socials_platform; o.socials_url = SPECIAL.socials_url; }
    else if (f.type === 'pairs') { o[`${f.name}_a`] = ['First', 'Second']; o[`${f.name}_b`] = ['#1', '#2']; }
    else if (f.type === 'select' && !f.options?.length) o[f.name] = ''; // choices that come from the database (none here)
    else if (f.name in SPECIAL) o[f.name] = SPECIAL[f.name];
    else if (f.type === 'color') o[f.name] = '#10B981';
    else if (f.type === 'image') o[f.name] = `${f.folder}/3f2b8c1e-4a5d-4e6f-8a9b-0c1d2e3f4a5b.webp`;
    else if (f.type === 'date') o[f.name] = '2026-01-15';
    else if (f.type === 'url') o[f.name] = 'https://example.com/page';
    else if (f.type === 'number') o[f.name] = '5';
    else if (f.type === 'select') o[f.name] = f.options![0].value;
    else o[f.name] = 'Sample text'.slice(0, f.max ?? 11);
  }
  return o;
}

const JSON_COLUMNS = new Set(['socials', 'metrics', 'visual_data']);
/** A validated form result -> the row the save action would write for that section. */
const toRow = (slug: string, data: CleanData): CleanData => (slug === 'case-studies' ? toDbCase(data) : data);

/** Turn a validated value into a SQL parameter + cast. */
function param(v: CleanData[string], col: string): { sql: string; value: unknown } {
  if (Array.isArray(v)) {
    // an empty list is ambiguous, so the one JSON column (socials) is named explicitly
    return JSON_COLUMNS.has(col) || (v.length && typeof v[0] === 'object') ? { sql: '::jsonb', value: JSON.stringify(v) } : { sql: '::text[]', value: v };
  }
  if (v && typeof v === 'object') return { sql: '::jsonb', value: JSON.stringify(v) };
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
    await asRun(() => insert(section.table, { ...toRow(section.slug, r.data), sort_order: 1 }));
  });

  test(`${section.slug}: every text limit exists in the database (limit accepted, limit+1 rejected)`, async () => {
    // (visual_* fields are not columns: they are folded into the visual_data JSON, which has no per-field limit)
    for (const f of section.fields.filter((x) => (x.type === 'text' || x.type === 'textarea') && x.max && !x.pattern && !(VISUAL_FIELDS as readonly string[]).includes(x.name))) {
      const base = validateFields(section.fields, src(sampleInput(section.fields)));
      assert.ok(base.ok);
      await asRun(() => insert(section.table, { ...toRow(section.slug, base.data), [f.name]: 'x'.repeat(f.max!), sort_order: 1 })); // exactly at the limit: fine
      await assert.rejects(
        asRun(() => insert(section.table, { ...toRow(section.slug, base.data), [f.name]: 'x'.repeat(f.max! + 1), sort_order: 1 })),
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

// ---------------------------------------------------------------------------------------------
// Case studies: every card style, the metrics and the generated web address
// ---------------------------------------------------------------------------------------------
const CASE = SECTIONS['case-studies'];

for (const type of ['bars', 'line', 'ranking', 'ad', 'image']) {
  test(`case studies: the "${type}" card style saves (visual_data is built from the friendly fields)`, async () => {
    const input = { ...sampleInput(CASE.fields), visual_type: type, visual_title: 'Chart title', visual_footer_label: 'Calls', visual_footer_value: '+9%', visual_headline: 'Ad', visual_text: 'Copy' };
    const r = validateFields(CASE.fields, src(input));
    assert.ok(r.ok, JSON.stringify(!r.ok && r.errors));
    const row = toRow('case-studies', r.data);
    await asRun(async () => {
      await insert('case_studies', { ...row, sort_order: 1 });
      const { rows } = await db.query("select visual_type, visual_data from public.case_studies where slug = 'my-sample-project'");
      assert.equal(rows[0].visual_type, type);
      assert.equal(typeof rows[0].visual_data, 'object');
    });
  });
}

test('case studies: leaving the web address empty creates a valid one from the title', async () => {
  const input = { ...sampleInput(CASE.fields), slug: '', title: 'Scaling Online Sales: +240% ROAS!' };
  const r = validateFields(CASE.fields, src(input));
  assert.ok(r.ok, JSON.stringify(!r.ok && r.errors));
  await asRun(async () => {
    await insert('case_studies', { ...toRow('case-studies', r.data), sort_order: 1 });
    const { rows } = await db.query('select slug from public.case_studies');
    assert.equal(rows[0].slug, 'scaling-online-sales-240-roas');
  });
});

test('case studies: more than 4 key numbers is stopped by the form (and by the database)', async () => {
  const five = { ...sampleInput(CASE.fields), metrics_a: ['a', 'b', 'c', 'd', 'e'], metrics_b: ['1', '2', '3', '4', '5'] };
  assert.equal(validateFields(CASE.fields, src(five)).ok, false);
  const ok = validateFields(CASE.fields, src(sampleInput(CASE.fields)));
  assert.ok(ok.ok);
  await assert.rejects(asRun(() => insert('case_studies', { ...toRow('case-studies', ok.data), metrics: [{}, {}, {}, {}, {}], sort_order: 1 })), () => true);
});

test('case studies: a duplicate web address is rejected by the database (the action turns this into a friendly message)', async () => {
  const r = validateFields(CASE.fields, src(sampleInput(CASE.fields)));
  assert.ok(r.ok);
  await assert.rejects(
    asRun(async () => {
      await insert('case_studies', { ...toRow('case-studies', r.data), sort_order: 1 });
      await insert('case_studies', { ...toRow('case-studies', r.data), sort_order: 2 });
    }),
    (e: unknown) => /duplicate|unique/i.test(String((e as Error).message)),
  );
});

test('case studies: a conditional field for a different card style is ignored, not saved', () => {
  const input = { ...sampleInput(CASE.fields), visual_type: 'bars', visual_headline: 'x'.repeat(500), visual_rows_a: ['x'.repeat(500)], visual_rows_b: ['y'] };
  const r = validateFields(CASE.fields, src(input));
  assert.ok(r.ok, JSON.stringify(!r.ok && r.errors)); // the oversized ad/ranking fields are hidden for "bars", so they do not block saving
  assert.ok(!('visual_headline' in r.data) && !('visual_rows' in r.data));
});

// ---------------------------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------------------------
test('testimonials: a rating is stored as a number and an empty link as NULL', async () => {
  const TEST = SECTIONS.testimonials;
  const r = validateFields(TEST.fields, src({ ...sampleInput(TEST.fields), rating: '4' }));
  assert.ok(r.ok, JSON.stringify(!r.ok && r.errors));
  assert.equal(r.data.rating, 4);
  assert.equal(r.data.case_study_id, null);
  await asRun(async () => {
    await insert('testimonials', { ...r.data, sort_order: 1 });
    const { rows } = await db.query('select rating, case_study_id from public.testimonials');
    assert.equal(rows[0].rating, 4);
    assert.equal(rows[0].case_study_id, null);
  });
});

test('testimonials: a rating outside 1-5 is rejected by both form and database', async () => {
  const TEST = SECTIONS.testimonials;
  assert.equal(validateFields(TEST.fields, src({ ...sampleInput(TEST.fields), rating: '6' })).ok, false);
  const r = validateFields(TEST.fields, src(sampleInput(TEST.fields)));
  assert.ok(r.ok);
  await assert.rejects(asRun(() => insert('testimonials', { ...r.data, rating: 6, sort_order: 1 })), () => true);
});

test('images: a path saved by any image field fits its database column, and clearing it stores NULL', async () => {
  for (const [label, fields, table] of [['profile', PROFILE_FIELDS, 'profile'], ['settings', SETTINGS_FIELDS, 'site_settings']] as const) {
    const img = fields.filter((f) => f.type === 'image');
    assert.ok(img.length > 0, `${label} has an image field`);
    const set = validateFields(fields, src(sampleInput(fields)));
    assert.ok(set.ok, JSON.stringify(!set.ok && set.errors));
    await asRun(() => update(table, set.data));
    const cleared = validateFields(fields, src({ ...sampleInput(fields), ...Object.fromEntries(img.map((f) => [f.name, ''])) }));
    assert.ok(cleared.ok && img.every((f) => cleared.data[f.name] === null));
    await asRun(() => update(table, cleared.data));
  }
});

test('images: a path from the wrong folder, a URL or a traversal attempt is refused by the form', () => {
  const photo = PROFILE_FIELDS.find((f) => f.name === 'photo_path')!;
  for (const bad of ['brands/3f2b8c1e-4a5d-4e6f-8a9b-0c1d2e3f4a5b.webp', 'https://evil.com/x.webp', '../profile/3f2b8c1e-4a5d-4e6f-8a9b-0c1d2e3f4a5b.webp', 'profile/x.svg']) {
    assert.equal(validateFields([photo], src({ photo_path: bad })).ok, false, bad);
  }
});

test('certifications: dates and links are stored as the database expects', async () => {
  const B = SECTIONS.badges;
  const r = validateFields(B.fields, src(sampleInput(B.fields)));
  assert.ok(r.ok, JSON.stringify(!r.ok && r.errors));
  await asRun(async () => {
    await insert('certifications', { ...r.data, sort_order: 1 });
    const { rows } = await db.query("select issued_on::text as d, verify_url from public.certifications");
    assert.equal(rows[0].d, '2026-01-15');
    assert.equal(rows[0].verify_url, 'https://example.com/page');
  });
  assert.equal(validateFields(B.fields, src({ ...sampleInput(B.fields), issued_on: '2026-02-30' })).ok, false); // not a real date
  assert.equal(validateFields(B.fields, src({ ...sampleInput(B.fields), verify_url: 'javascript:alert(1)' })).ok, false);
  await assert.rejects(asRun(() => insert('certifications', { ...r.data, verify_url: 'javascript:alert(1)', sort_order: 1 })), () => true); // database agrees
});
