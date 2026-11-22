// Pure (no imports) so it can be unit-tested.

/** Sign-in methods Supabase records when someone arrives through an emailed link (not a password). */
const EMAIL_LINK_METHODS = new Set(['recovery', 'otp', 'magiclink']);

/** How long after clicking the reset link the "set new password" form may be used. */
export const RESET_WINDOW_SECONDS = 60 * 60;

/**
 * True when the session was opened by an emailed reset link within the window.
 * `amr` is the "authentication methods" list from the verified session token.
 *
 * Why: "set new password" does not ask for the current password (that is the point of a reset),
 * so it must not be usable by an ordinary signed-in session — otherwise a stolen session cookie
 * would be enough to take over the account.
 */
export function isRecentResetLogin(amr: unknown, nowSeconds: number, windowSeconds = RESET_WINDOW_SECONDS): boolean {
  if (!Array.isArray(amr)) return false;
  return amr.some((a) => {
    if (!a || typeof a !== 'object') return false;
    const { method, timestamp } = a as { method?: unknown; timestamp?: unknown };
    return typeof method === 'string' && EMAIL_LINK_METHODS.has(method)
      && typeof timestamp === 'number' && timestamp <= nowSeconds + 60 && nowSeconds - timestamp <= windowSeconds;
  });
}
