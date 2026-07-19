import type { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { AppError } from '../../application/errors/AppError';

const CSRF_COOKIE = 'csrfToken';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Double-submit-cookie CSRF protection.
 *
 * Every response carries a `csrfToken` cookie. It is intentionally NOT HttpOnly:
 * it is not a secret that grants access, it is a value the SPA must be able to
 * read and echo back in the `x-csrf-token` header on every state-changing
 * request. The server then checks that the header matches the cookie.
 *
 * Why this stops CSRF: a malicious cross-site page can cause the browser to send
 * the victim's session cookie (and this csrf cookie) along with a forged
 * request, but the same-origin policy prevents that page from *reading* the
 * token, so it cannot populate the matching `x-csrf-token` header. The forged
 * request therefore fails this check. Read-only methods are exempt because they
 * do not change server state.
 *
 * Token lifetime is deliberately NOT treated as the CSRF control — this header
 * check is. (See AuthController for why the auth token itself is long-lived.)
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  const cookies = (req.cookies ?? {}) as Record<string, string>;
  let token = cookies[CSRF_COOKIE];

  // Issue a token to clients that don't have one yet, and expose it on
  // res.locals so the GET /api/csrf-token endpoint can hand it to the SPA.
  if (!token) {
    token = randomBytes(32).toString('hex');
    // Strict is safe here: this cookie is only ever read via same-origin
    // fetch calls from our own SPA, never involved in a redirect-based flow,
    // unlike the OAuth state cookie in AuthController.ts.
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
    });
  }
  res.locals.csrfToken = token;

  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const header = req.get(CSRF_HEADER);
  if (!header || header !== token) {
    next(AppError.forbidden('Invalid or missing CSRF token'));
    return;
  }
  next();
}
