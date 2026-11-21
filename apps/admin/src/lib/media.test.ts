import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_BYTES, fileProblem, fitWithin, isMediaPath, newMediaPath, replacedImages, shouldConvert } from './media.ts';

const ID = '3f2b8c1e-4a5d-4e6f-8a9b-0c1d2e3f4a5b';

test('fileProblem: accepts normal images', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']) assert.equal(fileProblem({ type, size: 1000 }), null, type);
});
test('fileProblem: rejects SVG with a reason (it can carry scripts)', () => assert.match(fileProblem({ type: 'image/svg+xml', size: 10 })!, /SVG/));
test('fileProblem: rejects non-images and disguised files', () => {
  for (const type of ['application/pdf', 'text/html', 'application/javascript', '', 'image/heic']) assert.ok(fileProblem({ type, size: 10 }), type);
});
test('fileProblem: size limits', () => {
  assert.equal(fileProblem({ type: 'image/png', size: MAX_BYTES }), null);
  assert.match(fileProblem({ type: 'image/png', size: MAX_BYTES + 1 })!, /5 MB/);
  assert.ok(fileProblem({ type: 'image/png', size: 0 }));
});

test('newMediaPath: folder + random id + extension from the type', () => {
  assert.equal(newMediaPath('profile', 'image/webp', ID), `profile/${ID}.webp`);
  assert.equal(newMediaPath('cases', 'image/jpeg', ID.toUpperCase()), `cases/${ID}.jpg`);
  assert.throws(() => newMediaPath('cases', 'image/svg+xml', ID));
});

test('isMediaPath: only accepts our own path format in the expected folder', () => {
  assert.equal(isMediaPath(`profile/${ID}.webp`, 'profile'), true);
  assert.equal(isMediaPath(`brands/${ID}.png`, 'brands'), true);
  const bad = [
    `brands/${ID}.webp`, // wrong folder for this field
    `profile/../secret/${ID}.webp`, `../profile/${ID}.webp`, `profile/${ID}.webp/../../x`,
    `profile/${ID}.svg`, `profile/${ID}.html`, `profile/${ID}`, `profile/not-a-uuid.webp`,
    `https://evil.com/profile/${ID}.webp`, `/profile/${ID}.webp`, `profile//${ID}.webp`,
    `PROFILE/${ID}.webp`, `profile/${ID.toUpperCase()}.webp`, '', null, undefined, 42,
  ];
  for (const p of bad) assert.equal(isMediaPath(p, 'profile'), false, String(p));
});

test('fitWithin: shrinks the longest side, keeps the shape, never enlarges', () => {
  assert.deepEqual(fitWithin(4000, 3000, 2000), { width: 2000, height: 1500, scaled: true });
  assert.deepEqual(fitWithin(1125, 1406, 1600), { width: 1125, height: 1406, scaled: false });
  assert.deepEqual(fitWithin(3000, 6000, 1500), { width: 750, height: 1500, scaled: true });
  assert.deepEqual(fitWithin(10000, 1, 1000), { width: 1000, height: 1, scaled: true }); // never 0
  assert.deepEqual(fitWithin(0, 100, 1000), { width: 0, height: 0, scaled: false });
});

test('shouldConvert: everything except GIF (keeps animations)', () => {
  assert.equal(shouldConvert('image/gif'), false);
  assert.equal(shouldConvert('image/png'), true);
});

test('replacedImages: only old files that were actually replaced or removed', () => {
  const fields = [{ type: 'image', name: 'photo' }, { type: 'image', name: 'cover' }, { type: 'text', name: 'title' }];
  const before = { photo: 'profile/a.webp', cover: 'cases/b.webp', title: 'old' };
  assert.deepEqual(replacedImages(fields, before, { photo: 'profile/new.webp', cover: 'cases/b.webp', title: 'x' }), ['profile/a.webp']); // replaced
  assert.deepEqual(replacedImages(fields, before, { photo: null, cover: 'cases/b.webp' }), ['profile/a.webp']); // removed
  assert.deepEqual(replacedImages(fields, before, { photo: 'profile/a.webp', cover: 'cases/b.webp' }), []); // unchanged
  assert.deepEqual(replacedImages(fields, { photo: null, cover: null }, { photo: 'profile/n.webp', cover: null }), []); // first upload: nothing to delete
  assert.deepEqual(replacedImages(fields, before, { title: 'only text saved' }), []); // field not part of this save
  assert.deepEqual(replacedImages(fields, null, { photo: 'profile/n.webp' }), []); // new item
});
