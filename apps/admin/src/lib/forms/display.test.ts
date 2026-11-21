import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_FIELDS, SECTIONS, SETTINGS_FIELDS } from './config.ts';
import { captionFor, toInitial } from './display.ts';
import { validateFields, type Source } from './validate.ts';

const src = (o: Record<string, string>): Source => ({
  get: (n) => (n in o ? o[n] : null),
  getAll: (n) => (n in o ? [o[n]] : []),
});

test('toInitial: new items use field defaults', () => {
  const v = toInitial(SECTIONS.services.fields, null);
  assert.equal(v.icon, 'target');
  assert.equal(v.is_visible, 'on'); // visible by default
  assert.equal(v.title, '');
});

test('toInitial: existing rows become raw form text (lines, socials, checkboxes, nulls)', () => {
  const v = toInitial(SETTINGS_FIELDS, {
    budget_options: ['A', 'B'], socials: [{ platform: 'x', url: 'https://x.com/me' }], show_faq: false, show_tools: true, ga4_id: null,
  });
  assert.equal(v.budget_options, 'A\nB');
  assert.deepEqual(JSON.parse(v.socials), [{ platform: 'x', url: 'https://x.com/me' }]);
  assert.equal(v.show_faq, '');
  assert.equal(v.show_tools, 'on');
  assert.equal(v.ga4_id, '');
});

test('round trip: a row loaded into the form and saved again is unchanged', () => {
  const row = {
    full_name: 'Jane Doe', short_name: 'Jane', initials: 'JD', role_title: 'Marketer', headline: 'Turning Data Into Growth', headline_accent: 'Growth',
    hero_tags: ['Ads', 'SEO'], hero_intro: 'Hi', photo_alt: null, is_available: true, availability_text: 'Open', trust_text: null,
    about_title: 'About me', about_body: 'Line one\n\nLine two', about_quote: null, location: 'Dhaka',
  };
  const form = toInitial(PROFILE_FIELDS, row);
  const r = validateFields(PROFILE_FIELDS, {
    get: (n) => (n in form ? form[n] : null),
    getAll: (n) => (n === 'socials_platform' || n === 'socials_url' ? [] : n in form ? [form[n]] : []),
  });
  assert.ok(r.ok, JSON.stringify(!r.ok && r.errors));
  assert.deepEqual(r.data.hero_tags, ['Ads', 'SEO']);
  assert.equal(r.data.about_body, 'Line one\n\nLine two');
  assert.equal(r.data.photo_alt, null); // nullable columns stay NULL, not ''
  assert.equal(r.data.is_available, true);
});

test('captions are short and sensible', () => {
  assert.equal(captionFor('stats', { prefix: '$', value: 12000, suffix: '+', decimals: 0, show_in_hero: true }), '$12,000+  ·  also in hero');
  assert.equal(captionFor('stats', { prefix: '', value: 3.2, suffix: 'x', decimals: 1 }), '3.2x');
  assert.match(captionFor('services', { description: 'Great', features: ['a', 'b'] }), /Great {2}· {2}2 bullet points/);
  assert.equal(captionFor('services', { description: '', features: ['a'] }), '1 bullet point');
  assert.ok(captionFor('faq', { answer: 'x'.repeat(300) }).length <= 90);
  assert.equal(captionFor('tools', { color: '#10B981' }), '#10B981');
});

test('toInitial ignores unrelated keys and handles stringy numbers', () => {
  const v = toInitial(SECTIONS.stats.fields, { value: '12.50', decimals: 2, label: 'Leads', extra: 'nope' });
  assert.equal(v.value, '12.50');
  assert.equal(v.decimals, '2');
  assert.ok(!('extra' in v));
});
void src;
