/**
 * Only allow redirects to paths inside this app ("/settings"), never to another site.
 * Prevents open-redirect phishing ("sign in → bounced to a fake page").
 *
 * Checked by resolving the path exactly as a browser would and requiring it to stay on this
 * origin — a block-list misses tricks like "/\tevil.com" or "/\t/evil.com" (browsers delete tabs
 * and newlines inside URLs, turning them into "//evil.com").
 */
const BASE = 'http://same-origin.invalid';

export function safeNextPath(next: unknown, fallback = '/'): string {
  if (typeof next !== 'string' || next.length > 2000) return fallback;
  if (!next.startsWith('/')) return fallback;
  // no control characters, whitespace or backslashes anywhere (browsers rewrite or strip them)
  if (/[\u0000- \u007f\\]/.test(next)) return fallback;
  let url: URL;
  try {
    url = new URL(next, BASE);
  } catch {
    return fallback;
  }
  if (url.origin !== BASE) return fallback;
  return url.pathname + url.search + url.hash;
}
