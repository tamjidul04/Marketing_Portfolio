import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isRecentResetLogin } from './reset-window.ts';

const NOW = 1_800_000_000;

test('reset window: a fresh reset-link sign-in is allowed', () => {
  assert.ok(isRecentResetLogin([{ method: 'recovery', timestamp: NOW - 60 }], NOW));
  assert.ok(isRecentResetLogin([{ method: 'otp', timestamp: NOW - 3000 }], NOW));
  assert.ok(isRecentResetLogin([{ method: 'password', timestamp: NOW - 10 }, { method: 'recovery', timestamp: NOW - 10 }], NOW));
});

test('reset window: a normal password session is NOT allowed (stolen cookie case)', () => {
  assert.equal(isRecentResetLogin([{ method: 'password', timestamp: NOW - 5 }], NOW), false);
  assert.equal(isRecentResetLogin([{ method: 'token_refresh', timestamp: NOW - 5 }], NOW), false);
});

test('reset window: an old reset link session is NOT allowed', () => {
  assert.equal(isRecentResetLogin([{ method: 'recovery', timestamp: NOW - 3601 }], NOW), false);
  assert.equal(isRecentResetLogin([{ method: 'recovery', timestamp: NOW + 3600 }], NOW), false); // from the future
});

test('reset window: junk input is NOT allowed', () => {
  for (const bad of [undefined, null, 'recovery', {}, [null], [{ method: 'recovery' }], [{ method: 'recovery', timestamp: '1' }], [{ timestamp: NOW }]]) {
    assert.equal(isRecentResetLogin(bad, NOW), false, JSON.stringify(bad));
  }
});
