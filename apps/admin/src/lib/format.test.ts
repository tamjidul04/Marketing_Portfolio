import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialsOf, readableOn, timeAgo } from './format.ts';

const NOW = Date.parse('2026-11-21T12:00:00Z');
const ago = (ms: number) => new Date(NOW - ms).toISOString();

test('timeAgo: just now', () => assert.equal(timeAgo(ago(10_000), NOW), 'just now'));
test('timeAgo: minutes', () => assert.equal(timeAgo(ago(5 * 60_000), NOW), '5 min ago'));
test('timeAgo: hours', () => assert.equal(timeAgo(ago(3 * 3_600_000), NOW), '3 h ago'));
test('timeAgo: yesterday and days', () => {
  assert.equal(timeAgo(ago(30 * 3_600_000), NOW), 'yesterday');
  assert.equal(timeAgo(ago(4 * 86_400_000), NOW), '4 days ago');
});
test('timeAgo: older than a week becomes a date', () => assert.match(timeAgo(ago(20 * 86_400_000), NOW), /2026/));
test('timeAgo: future or invalid input is safe', () => {
  assert.equal(timeAgo(new Date(NOW + 60_000).toISOString(), NOW), 'just now');
  assert.equal(timeAgo('not a date', NOW), '');
});

test('readableOn picks readable text on emerald, navy and white', () => {
  assert.equal(readableOn('#10B981'), '#1B2A4A');
  assert.equal(readableOn('#1B2A4A'), '#FFFFFF');
  assert.equal(readableOn('#FFFFFF'), '#1B2A4A');
});

test('initialsOf', () => {
  assert.equal(initialsOf('Jane Q Doe'), 'JQ');
  assert.equal(initialsOf('   '), '?');
});
