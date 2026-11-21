/**
 * Only allow redirects to paths inside this app ("/settings"), never to another site
 * ("//evil.com", "https://evil.com", "/\\evil.com"). Prevents open-redirect phishing.
 */
export function safeNextPath(next: unknown, fallback = '/'): string {
  if (typeof next !== 'string') return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  if (/[\r\n]/.test(next)) return fallback;
  return next;
}
