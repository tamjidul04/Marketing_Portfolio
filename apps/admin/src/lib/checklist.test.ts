import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildChecklist, progress, type ChecklistInput } from './checklist.ts';

const sample: ChecklistInput = {
  fullName: 'Your Name', photoPath: null, contactEmail: 'you@example.com', whatsapp: '15550000000',
  seoDescription: 'Sample description for search engines.', publishedSlugs: ['demo-ecommerce', 'demo-leads'], pixelId: null, ga4Id: null,
};
const real: ChecklistInput = {
  fullName: 'Jane Doe', photoPath: 'profile/me.webp', contactEmail: 'jane@jane.com', whatsapp: '8801700000000',
  seoDescription: 'Digital marketer helping brands grow.', publishedSlugs: ['demo-ecommerce', 'fashion-brand-2x-roas'], pixelId: '1234567890', ga4Id: null,
};
const done = (i: ChecklistInput, id: string) => buildChecklist(i).find((x) => x.id === id)!.done;

test('a fresh template has every required item open', () => {
  assert.deepEqual(progress(buildChecklist(sample)), { done: 0, total: 5 });
});
test('sample values never count as done', () => {
  for (const id of ['name', 'photo', 'contact', 'seo', 'case', 'analytics']) assert.equal(done(sample, id), false, id);
});
test('real values complete every item', () => {
  assert.deepEqual(progress(buildChecklist(real)), { done: 5, total: 5 });
  assert.equal(done(real, 'analytics'), true);
});
test('contact needs BOTH a real email and a real WhatsApp', () => {
  assert.equal(done({ ...real, whatsapp: '15550000000' }, 'contact'), false);
  assert.equal(done({ ...real, contactEmail: 'you@example.com' }, 'contact'), false);
  assert.equal(done({ ...real, whatsapp: null }, 'contact'), false);
});
test('only demo case studies published = not done; one real one = done', () => {
  assert.equal(done({ ...real, publishedSlugs: ['demo-a', 'demo-b'] }, 'case'), false);
  assert.equal(done({ ...real, publishedSlugs: [] }, 'case'), false);
  assert.equal(done({ ...real, publishedSlugs: ['demo-a', 'my-project'] }, 'case'), true);
});
test('analytics is optional and does not affect progress', () => {
  const a = buildChecklist({ ...real, pixelId: null, ga4Id: null });
  assert.equal(a.find((x) => x.id === 'analytics')!.optional, true);
  assert.deepEqual(progress(a), { done: 5, total: 5 });
});
test('blank or whitespace strings are treated as empty', () => {
  assert.equal(done({ ...real, fullName: '   ' }, 'name'), false);
  assert.equal(done({ ...real, photoPath: '  ' }, 'photo'), false);
});
