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
      // case_study_id is the one choice list that is filled from the database at run time (see dynamic.ts)
      if (x.type === 'select' && x.name !== 'case_study_id') assert.ok(x.options?.length, `${x.name} needs options`);
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

test('numbers: comma / space / newline separated, range and count are enforced', () => {
  const n = f({ type: 'numbers', min: 0, max: 100, minItems: 2, maxItems: 4 });
  const ok = one(n, '10, 20\n30 40');
  assert.ok(ok.ok && JSON.stringify(ok.data.x) === '[10,20,30,40]');
  assert.equal(one(n, '10').ok, false); // too few
  assert.equal(one(n, '1,2,3,4,5').ok, false); // too many
  assert.equal(one(n, '10, 101').ok, false); // out of range
  assert.equal(one(n, '10, -1').ok, false);
  assert.equal(one(n, '10, abc').ok, false);
  const empty = one(n, '  ');
  assert.ok(empty.ok && JSON.stringify(empty.data.x) === '[]'); // optional: empty is fine
  assert.equal(one({ ...n, required: true }, '').ok, false);
});

test('pairs: validates both sides, ignores empty rows, builds objects with the configured keys', () => {
  const p = f({ name: 'm', type: 'pairs', maxItems: 2, pair: { keys: ['label', 'value'], labels: ['Metric', 'Value'], maxLen: [5, 4] } });
  const good = validateFields([p], src({ m_a: ['ROAS', '', 'CPC'], m_b: ['4x', '', '$1'] }));
  assert.ok(good.ok && JSON.stringify(good.data.m) === '[{"label":"ROAS","value":"4x"},{"label":"CPC","value":"$1"}]');
  assert.equal(validateFields([p], src({ m_a: ['toolongname'], m_b: ['1'] })).ok, false);
  assert.equal(validateFields([p], src({ m_a: ['A'], m_b: ['toolong'] })).ok, false);
  assert.equal(validateFields([p], src({ m_a: ['A'], m_b: [''] })).ok, false); // half a row
  assert.equal(validateFields([p], src({ m_a: ['a', 'b', 'c'], m_b: ['1', '2', '3'] })).ok, false); // too many rows
  assert.ok(validateFields([p], src({})).ok); // none at all is fine when optional
  assert.equal(validateFields([{ ...p, required: true }], src({})).ok, false);
});

test('showIf: a hidden field is neither validated nor saved; a shown one is', () => {
  const fields: Field[] = [
    f({ name: 'kind', type: 'select', required: true, options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] }),
    f({ name: 'only_b', required: true, max: 3, showIf: { field: 'kind', in: ['b'] } }),
  ];
  const hidden = validateFields(fields, src({ kind: 'a', only_b: 'way too long and also required' }));
  assert.ok(hidden.ok && !('only_b' in hidden.data));
  assert.equal(validateFields(fields, src({ kind: 'b' })).ok, false); // shown + required + missing
  assert.equal(validateFields(fields, src({ kind: 'b', only_b: 'toolong' })).ok, false);
  const shown = validateFields(fields, src({ kind: 'b', only_b: 'ok' }));
  assert.ok(shown.ok && shown.data.only_b === 'ok');
});

test('select asNumber stores a number (and null when optional and empty)', () => {
  const sel = f({ type: 'select', nullable: true, asNumber: true, options: [{ value: '4', label: '4' }] });
  const a = one(sel, '4');
  const b = one(sel, '');
  assert.ok(a.ok && a.data.x === 4);
  assert.ok(b.ok && b.data.x === null);
  assert.equal(one(sel, '9').ok, false);
});

test('readValues echoes pairs rows as {a,b} for the form', () => {
  const v = readValues([f({ name: 'm', type: 'pairs' })], src({ m_a: ['x', 'y'], m_b: ['1', '2'] }));
  assert.deepEqual(JSON.parse(v.m), [{ a: 'x', b: '1' }, { a: 'y', b: '2' }]);
});
