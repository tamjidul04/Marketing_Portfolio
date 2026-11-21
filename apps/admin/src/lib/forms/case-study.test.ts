import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildVisualData, fromDbCase, parseVisualData, slugify, toDbCase, VISUAL_FIELDS } from './case-study.ts';

test('slugify: plain text, punctuation and spacing', () => {
  assert.equal(slugify('Scaling online sales for a clothing brand'), 'scaling-online-sales-for-a-clothing-brand');
  assert.equal(slugify('  Fashion E-commerce: +240% ROAS!  '), 'fashion-e-commerce-240-roas');
  assert.equal(slugify('A -- B __ C'), 'a-b-c');
});
test('slugify: accents become plain letters; non-latin falls back safely', () => {
  assert.equal(slugify('Café Ünïcode Résumé'), 'cafe-unicode-resume');
  assert.equal(slugify('日本語'), 'case-study');
  assert.equal(slugify('!!!'), 'case-study');
});
test('slugify: result always matches the database rule and length limit', () => {
  const RULE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  for (const s of ['x'.repeat(300), 'a-'.repeat(100), 'Hello World', '---a---', '$$$ 100% $$$']) {
    const out = slugify(s);
    assert.match(out, RULE, s);
    assert.ok(out.length <= 120);
  }
});

test('visual data: bars and line use their own key names', () => {
  assert.deepEqual(buildVisualData('bars', { visual_title: ' Revenue ', visual_numbers: [10, 20, 30] }), { title: 'Revenue', values: [10, 20, 30] });
  assert.deepEqual(buildVisualData('line', { visual_numbers: [80, 40] }), { points: [80, 40] });
});
test('visual data: ranking keeps rows and footer, ad keeps headline and text', () => {
  const r = buildVisualData('ranking', { visual_rows: [{ label: 'Us', rank: '#1' }], visual_footer_label: 'Calls', visual_footer_value: '+180%' });
  assert.deepEqual(r, { rows: [{ label: 'Us', rank: '#1' }], footer_label: 'Calls', footer_value: '+180%' });
  assert.deepEqual(buildVisualData('ad', { visual_headline: 'Sale', visual_text: 'Shop now' }), { headline: 'Sale', text: 'Shop now' });
});
test('visual data: fields that do not belong to the chosen style are ignored', () => {
  assert.deepEqual(buildVisualData('bars', { visual_headline: 'nope', visual_rows: [{ label: 'x', rank: '1' }], visual_numbers: [1, 2] }), { values: [1, 2] });
  assert.deepEqual(buildVisualData('image', { visual_numbers: [1, 2], visual_title: 'x' }), {});
});
test('visual data: empty inputs produce an empty object (the website then uses its defaults)', () => {
  assert.deepEqual(buildVisualData('bars', { visual_title: '', visual_numbers: [] }), {});
});

test('round trip: build then parse returns the same friendly fields', () => {
  const form = { visual_title: 'Cost per lead', visual_numbers: [80, 60, 30] };
  const back = parseVisualData('line', buildVisualData('line', form));
  assert.deepEqual(back, { visual_title: 'Cost per lead', visual_numbers: [80, 60, 30] });
  const rank = { visual_title: 'Google', visual_rows: [{ label: 'Us', rank: '#1' }, { label: 'Them', rank: '#2' }], visual_footer_label: 'Calls', visual_footer_value: '+9%' };
  assert.deepEqual(parseVisualData('ranking', buildVisualData('ranking', rank)), rank);
});
test('parseVisualData tolerates junk stored in the database', () => {
  for (const junk of [null, undefined, 5, 'x', [], { values: 'no' }, { rows: [1, null, { label: 3 }] }]) {
    assert.doesNotThrow(() => parseVisualData('bars', junk));
    assert.doesNotThrow(() => parseVisualData('ranking', junk));
  }
  assert.deepEqual(parseVisualData('bars', { values: [1, 'x', 3] }), { visual_title: '', visual_numbers: [1, 3] });
});

test('toDbCase: strips helper fields, adds visual_data and a generated slug', () => {
  const row = toDbCase({ title: 'My Great Project', slug: '', visual_type: 'bars', visual_numbers: [1, 2], visual_title: '', status: 'draft', metrics: [{ label: 'ROAS', value: '4x' }] });
  for (const f of VISUAL_FIELDS) assert.ok(!(f in row), `${f} should not be a database column`);
  assert.equal(row.slug, 'my-great-project');
  assert.deepEqual(row.visual_data, { values: [1, 2] });
  assert.deepEqual(row.metrics, [{ label: 'ROAS', value: '4x' }]);
});
test('toDbCase: a typed slug is kept', () => {
  assert.equal(toDbCase({ title: 'Anything', slug: 'custom-slug', visual_type: 'image' }).slug, 'custom-slug');
});

test('fromDbCase: adds the friendly fields for the stored style', () => {
  const f = fromDbCase({ visual_type: 'bars', visual_data: { title: 'Revenue', values: [5, 9] }, title: 'T' });
  assert.equal(f.visual_title, 'Revenue');
  assert.deepEqual(f.visual_numbers, [5, 9]);
  assert.equal(f.title, 'T');
});
