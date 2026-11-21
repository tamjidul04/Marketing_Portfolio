import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_FIELDS, SECTIONS, SETTINGS_FIELDS } from './config.ts';
import { readValues, reorder, validateFields, type Source } from './validate.ts';
import type { Field } from './types.ts';

/** Build a form-like source from a plain object (arrays = several values for one name). */
const src = (o: Record<string, string | string[]>): Source => ({
  get: (n) => (n in o ? (Array.isArray(o[n]) ? (o[n] as string[])[0] ?? null : (o[n] as string)) : null),
  getAll: (n) => (n in o ? (Array.isArray(o[n]) ? (o[n] as string[]) : [o[n] as string]) : []),
});
const f = (over: Partial<Field>): Field => ({ name: 'x', label: 'X', type: 'text', ...over });
const one = (field: Field, value: string | string[]) => validateFields([field], src({ [field.name]: value }));

test('required text: empty is rejected, trimmed value accepted', () => {
  assert.equal(one(f({ required: true }), '   ').ok, false);
  const r = one(f({ required: true }), '  hello  ');
  assert.ok(r.ok && r.data.x === 'hello');
});
test('optional text: empty becomes NULL when nullable, empty string otherwise', () => {
  const a = one(f({ nullable: true }), '');
  const b = one(f({}), '');
  assert.ok(a.ok && a.data.x === null);
  assert.ok(b.ok && b.data.x === '');
});
test('max length is enforced with a helpful count', () => {
  const r = one(f({ max: 5 }), 'abcdefg');
  assert.ok(!r.ok && /under 5.*7/.test(r.errors.x));
});
test('null bytes are stripped', () => {
  const r = one(f({}), 'a' + String.fromCharCode(0) + 'b');
  assert.ok(r.ok && r.data.x === 'ab');
});
test('windows line endings are normalised', () => {
  const r = one(f({ type: 'textarea' }), 'a\r\nb');
  assert.ok(r.ok && r.data.x === 'a\nb');
});

test('number: parses, allows commas, enforces min/max/integer', () => {
  const n = f({ type: 'number', min: 0, max: 100 });
  const ok = one(n, '1,234'.replace('1,234', '12'));
  assert.ok(ok.ok && ok.data.x === 12);
  assert.ok(one(f({ type: 'number' }), '1,000').ok);
  assert.equal(one(n, '-1').ok, false);
  assert.equal(one(n, '101').ok, false);
  assert.equal(one(n, 'abc').ok, false);
  assert.equal(one(f({ type: 'number', integer: true }), '2.5').ok, false);
  assert.equal(one(f({ type: 'number' }), 'Infinity').ok, false);
});
test('number: empty optional = 0, required = error', () => {
  const a = one(f({ type: 'number' }), '');
  assert.ok(a.ok && a.data.x === 0);
  assert.equal(one(f({ type: 'number', required: true }), '').ok, false);
});

test('select only accepts listed options', () => {
  const s = f({ type: 'select', required: true, options: [{ value: 'a', label: 'A' }] });
  assert.ok(one(s, 'a').ok);
  assert.equal(one(s, 'b').ok, false);
  assert.equal(one(s, '').ok, false);
});

test('checkbox: ticked = true, missing = false', () => {
  const c = f({ type: 'checkbox' });
  const on = one(c, 'on');
  const off = validateFields([c], src({}));
  assert.ok(on.ok && on.data.x === true);
  assert.ok(off.ok && off.data.x === false);
});

test('lines: splits, trims, drops blanks, enforces counts and lengths', () => {
  const l = f({ type: 'lines', maxItems: 3, itemMax: 5 });
  const r = one(l, ' a \n\n b\r\nc ');
  assert.ok(r.ok && JSON.stringify(r.data.x) === '["a","b","c"]');
  assert.equal(one(l, 'a\nb\nc\nd').ok, false);
  assert.equal(one(l, 'toolong').ok, false);
  assert.equal(one(f({ type: 'lines', required: true }), '  \n ').ok, false);
});

test('color: strict #RRGGBB, stored upper-case', () => {
  const c = f({ type: 'color', required: true });
  const r = one(c, '#10b981');
  assert.ok(r.ok && r.data.x === '#10B981');
  for (const bad of ['10b981', '#fff', 'red', '#12345G', 'javascript:alert(1)']) assert.equal(one(c, bad).ok, false, bad);
});

test('email, phone and pattern fields', () => {
  assert.ok(one(f({ type: 'email' }), 'a@b.co').ok);
  assert.equal(one(f({ type: 'email' }), 'nope').ok, false);
  assert.ok(one(f({ type: 'phone' }), '+880 1700-000000').ok);
  assert.equal(one(f({ type: 'phone' }), 'call me').ok, false);
  const wa = f({ pattern: '^[0-9]{6,15}$', patternMessage: 'digits' });
  assert.ok(one(wa, '8801700000000').ok);
  const bad = one(wa, '+8801700000000');
  assert.ok(!bad.ok && bad.errors.x === 'digits');
});

test('socials: pairs rows, ignores empty rows, validates urls and names', () => {
  const s = f({ name: 'socials', type: 'socials', maxItems: 2 });
  const good = validateFields([s], src({ socials_platform: ['Facebook', '', 'x'], socials_url: ['https://fb.com/me', '', 'https://x.com/me'] }));
  assert.ok(good.ok && JSON.stringify(good.data.socials) === '[{"platform":"facebook","url":"https://fb.com/me"},{"platform":"x","url":"https://x.com/me"}]');
  for (const [p, u] of [['fb', 'javascript:alert(1)'], ['fb', 'ftp://x.com'], ['fb', ''], ['', 'https://a.com'], ['bad<name>', 'https://a.com']]) {
    assert.equal(validateFields([s], src({ socials_platform: [p], socials_url: [u] })).ok, false, `${p} | ${u}`);
  }
  assert.equal(validateFields([s], src({ socials_platform: ['a', 'b', 'c'], socials_url: ['https://a.co', 'https://b.co', 'https://c.co'] })).ok, false);
});

test('unknown extra form fields are ignored (no mass assignment)', () => {
  const r = validateFields([f({ name: 'title' })], src({ title: 'ok', is_admin: 'true', id: 'evil', sort_order: '-5' }));
  assert.ok(r.ok && JSON.stringify(Object.keys(r.data)) === '["title"]');
});

test('readValues echoes raw input, including socials and checkboxes', () => {
  const fields = [f({ name: 'a' }), f({ name: 'c', type: 'checkbox' }), f({ name: 'socials', type: 'socials' })];
  const v = readValues(fields, src({ a: '  raw  ', c: 'on', socials_platform: ['fb'], socials_url: ['u'] }));
  assert.equal(v.a, '  raw  ');
  assert.equal(v.c, 'on');
  assert.deepEqual(JSON.parse(v.socials), [{ platform: 'fb', url: 'u' }]);
});

test('every configured field has a unique name and sensible limits', () => {
  const all: Field[][] = [PROFILE_FIELDS, SETTINGS_FIELDS, ...Object.values(SECTIONS).map((s) => s.fields)];
  for (const fields of all) {
    assert.equal(new Set(fields.map((x) => x.name)).size, fields.length, 'duplicate field name');
    for (const x of fields) {
      if (x.type === 'select') assert.ok(x.options?.length, `${x.name} needs options`);
      if (x.max !== undefined) assert.ok(x.max > 0);
    }
  }
});

test('reorder: swaps neighbours, no-ops at the ends and for unknown ids', () => {
  const ids = ['a', 'b', 'c'];
  assert.deepEqual(reorder(ids, 'b', 'up'), ['b', 'a', 'c']);
  assert.deepEqual(reorder(ids, 'b', 'down'), ['a', 'c', 'b']);
  assert.deepEqual(reorder(ids, 'a', 'up'), ids);
  assert.deepEqual(reorder(ids, 'c', 'down'), ids);
  assert.deepEqual(reorder(ids, 'zzz', 'up'), ids);
  assert.notEqual(reorder(ids, 'a', 'up'), ids); // returns a copy
});
