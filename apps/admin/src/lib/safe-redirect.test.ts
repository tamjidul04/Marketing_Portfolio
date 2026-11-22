import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeNextPath } from './safe-redirect.ts';

const TAB = String.fromCharCode(9);
const NL = String.fromCharCode(10);
const CR = String.fromCharCode(13);
const BS = String.fromCharCode(92);
const NUL = String.fromCharCode(0);

test('safeNextPath: normal in-app paths are kept', () => {
  assert.equal(safeNextPath('/'), '/');
  assert.equal(safeNextPath('/settings'), '/settings');
  assert.equal(safeNextPath('/inbox?view=spam'), '/inbox?view=spam');
  assert.equal(safeNextPath('/case-studies/3f2a1b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b#gallery'), '/case-studies/3f2a1b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b#gallery');
  assert.equal(safeNextPath('/reset-password'), '/reset-password');
});

test('safeNextPath: other websites are refused', () => {
  for (const bad of [
    '//evil.com', '///evil.com', 'https://evil.com', 'http:/evil.com', 'evil.com', 'javascript:alert(1)',
    `/${BS}evil.com`, `/${BS}${BS}evil.com`, `${BS}${BS}evil.com`,
    `/${TAB}/evil.com`, `/${NL}/evil.com`, `/${CR}/evil.com`, `/${TAB}${BS}evil.com`, `/ /evil.com`,
    `/${NUL}/evil.com`, '/%09/evil.com/'.replace('%09', TAB),
  ]) {
    assert.equal(safeNextPath(bad), '/', JSON.stringify(bad));
  }
});

test('safeNextPath: encoded tricks stay on this site', () => {
  // percent-encoded slashes/backslashes are just characters in a path, not a new host
  assert.ok(safeNextPath('/%2F%2Fevil.com').startsWith('/'));
  assert.ok(!safeNextPath('/%2F%2Fevil.com').startsWith('//'));
  assert.ok(!safeNextPath('/%5Cevil.com').startsWith('//'));
  assert.equal(safeNextPath('/./settings'), '/settings');
  assert.equal(safeNextPath('/../settings'), '/settings');
});

test('safeNextPath: non-strings, huge values and custom fallback', () => {
  assert.equal(safeNextPath(null), '/');
  assert.equal(safeNextPath(undefined), '/');
  assert.equal(safeNextPath(['/x']), '/');
  assert.equal(safeNextPath('/' + 'a'.repeat(3000)), '/');
  assert.equal(safeNextPath('//evil.com', '/login'), '/login');
});
