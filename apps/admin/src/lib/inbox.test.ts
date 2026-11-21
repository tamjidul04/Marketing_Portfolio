import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanNote, isStatus, isUuid, parsePage, parseView, replyMailto, safeSourcePath, snippet, telHref, whatsappHref } from './inbox.ts';

test('parseView / isStatus: only known values', () => {
  assert.equal(parseView('spam'), 'spam');
  assert.equal(parseView('archived'), 'archived');
  assert.equal(parseView('toString'), 'inbox');
  assert.equal(parseView(['spam']), 'inbox');
  assert.equal(parseView(undefined), 'inbox');
  assert.ok(isStatus('replied'));
  assert.ok(!isStatus('deleted'));
  assert.ok(!isStatus('constructor'));
});

test('parsePage: positive, bounded integers only', () => {
  assert.equal(parsePage('3'), 3);
  assert.equal(parsePage('0'), 1);
  assert.equal(parsePage('-2'), 1);
  assert.equal(parsePage('1.5'), 1);
  assert.equal(parsePage('99999'), 1);
  assert.equal(parsePage('9999'), 1000);
  assert.equal(parsePage(undefined), 1);
});

test('isUuid', () => {
  assert.ok(isUuid('3f2a1b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b'));
  assert.ok(!isUuid('3f2a1b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b; drop'));
  assert.ok(!isUuid(42));
});

test('replyMailto: subject + greeting; refuses addresses that could inject', () => {
  const m = replyMailto('jane@acme.co', 'Jane Doe', 'Meta Ads')!;
  assert.ok(m.startsWith('mailto:jane@acme.co?subject='));
  assert.ok(decodeURIComponent(m).includes('Re: your enquiry about Meta Ads'));
  assert.ok(decodeURIComponent(m).includes('Hi Jane,'));
  assert.equal(replyMailto('a@b.co?bcc=x@y.z', 'Eve'), null);
  assert.equal(replyMailto('a@b.co&cc=x@y.z', 'Eve'), null);
  assert.equal(replyMailto('"a b"@x.co', 'Eve'), null);
  assert.equal(replyMailto(null, 'Eve'), null);
});

test('whatsappHref / telHref: digits only', () => {
  assert.equal(telHref('+880 1712-345678'), 'tel:+8801712345678');
  assert.equal(telHref('(555) 000 0000'), 'tel:5550000000');
  assert.equal(telHref('12'), null);
  const wa = whatsappHref('+1 555 000 0000', 'Sam Lee')!;
  assert.ok(wa.startsWith('https://wa.me/15550000000?text='));
  assert.ok(decodeURIComponent(wa).startsWith('https://wa.me/15550000000?text=Hi Sam,'));
  assert.equal(whatsappHref(null, 'Sam'), null);
});

test('safeSourcePath: plain site paths only', () => {
  assert.equal(safeSourcePath('/work/meta-ads'), '/work/meta-ads');
  assert.equal(safeSourcePath('/'), '/');
  assert.equal(safeSourcePath('//evil.com'), null);
  assert.equal(safeSourcePath('/x?y=1'), null);
  assert.equal(safeSourcePath('javascript:alert(1)'), null);
  assert.equal(safeSourcePath(null), null);
});

test('snippet: one line, shortened', () => {
  assert.equal(snippet('Hello\n\n  there'), 'Hello there');
  assert.equal(snippet('abcdefghij', 5), 'abcd…');
  assert.equal(snippet(null), '');
});

test('cleanNote: trims, empty → null, max 2000', () => {
  assert.deepEqual(cleanNote('  Called back \r\n'), { ok: true, note: 'Called back' });
  assert.deepEqual(cleanNote('   '), { ok: true, note: null });
  assert.equal(cleanNote('x'.repeat(2001)).ok, false);
  assert.equal(cleanNote(5).ok, false);
});
