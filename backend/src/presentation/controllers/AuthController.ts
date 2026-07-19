import type { Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import type { AuthRequest } from '../middleware/auth';
import { AuthService } from '../../application/services/AuthService';
import { UserService } from '../../application/services/UserService';
import { GoogleOAuthService } from '../../infrastructure/services/GoogleOAuthService';
import { RegisterDto, LoginDto, VerifyMfaSetupDto } from '../../application/dtos/auth.dto';

const isProduction = process.env.NODE_ENV === 'production';
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';
// Long-lived access token (15 days). This is safe here because the authenticate
// middleware re-checks the token's version against the database on every request,
// so logout / suspension / a credential change revokes the token immediately
// regardless of its natural expiry — token lifetime is NOT relied on as a
// security control (that role is filled by CSRF tokens, CSP, HttpOnly cookies,
// input validation, etc.).
const ACCESS_MAX_AGE = 15 * 24 * 60 * 60 * 1000; // 15 days
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

// HttpOnly cookies keep tokens out of reach of client-side JavaScript (XSS).
// SameSite=Strict means these cookies are sent only on same-site requests —
// not even on a top-level GET navigation arriving from an external site (the
// one gap Lax leaves open). Secure is enabled outside development. This is
// safe to set to Strict specifically because the frontend and backend are
// same-site (they share a registrable domain in production, and Chrome/Firefox
// treat different localhost ports as same-site too), so ordinary same-origin
// API calls are unaffected — the only cost is a session cookie not being sent
// on the very first top-level navigation after clicking an external link,
// which is why the OAuth `oauth_state` cookie below deliberately stays Lax.
function baseCookie() {
  return { httpOnly: true, secure: isProduction, sameSite: 'strict' as const, path: '/' };
}

function setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
  res.cookie('accessToken', tokens.accessToken, { ...baseCookie(), maxAge: ACCESS_MAX_AGE });
  res.cookie('refreshToken', tokens.refreshToken, { ...baseCookie(), maxAge: REFRESH_MAX_AGE });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken', baseCookie());
  res.clearCookie('refreshToken', baseCookie());
}

// Sets auth cookies when the result carries tokens, and never returns those
// tokens in the JSON body (so they can't be read by JavaScript).
function respondWithAuth(res: Response, status: number, result: Record<string, unknown>) {
  if (result.accessToken && result.refreshToken) {
    setAuthCookies(res, {
      accessToken: result.accessToken as string,
      refreshToken: result.refreshToken as string,
    });
    const { accessToken: _a, refreshToken: _r, ...safe } = result;
    void _a; void _r;
    res.status(status).json({ success: true, data: safe });
    return;
  }
  res.status(status).json({ success: true, data: result });
}

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly googleOAuth: GoogleOAuthService,
  ) {}

  // Step 1 of the Google OAuth flow: mint an anti-forgery `state`, stash it in a
  // short-lived HttpOnly cookie, and redirect the browser to Google's consent
  // screen. The state is checked on the callback to prevent OAuth CSRF.
  oauthGoogleStart = (req: AuthRequest, res: Response): void => {
    if (!this.googleOAuth.isConfigured()) {
      res.redirect(`${CLIENT_URL}/login?oauth=unconfigured`);
      return;
    }
    const state = randomBytes(16).toString('hex');
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: isProduction,
      // Must stay Lax, not Strict: Google's redirect back to our callback is a
      // genuine cross-site top-level navigation (the referring page is
      // accounts.google.com), and a Strict cookie would not be sent on it —
      // silently breaking every OAuth login. This is a well-known, unavoidable
      // conflict between SameSite=Strict and any redirect-based auth flow.
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
      path: '/',
    });
    res.redirect(this.googleOAuth.getAuthorizationUrl(state));
  };

  // Step 2: Google redirects back here with a code. Verify the state, exchange
  // the code for the profile, log the user in, set our own session cookies, and
  // bounce to the SPA. Errors redirect to the login page (never leak details).
  oauthGoogleCallback = async (req: AuthRequest, res: Response): Promise<void> => {
    const { code, state } = req.query as { code?: string; state?: string };
    const cookieState = req.cookies?.oauth_state as string | undefined;
    res.clearCookie('oauth_state', { path: '/' });

    if (!code || !state || !cookieState || state !== cookieState) {
      res.redirect(`${CLIENT_URL}/login?oauth=failed`);
      return;
    }

    try {
      const profile = await this.googleOAuth.exchangeCodeForProfile(code);
      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
      const ua = req.headers['user-agent'] || 'unknown';
      const result = await this.authService.loginWithGoogle(profile, ip, ua);
      setAuthCookies(res, {
        accessToken: result.accessToken as string,
        refreshToken: result.refreshToken as string,
      });
      res.redirect(`${CLIENT_URL}/`);
    } catch {
      res.redirect(`${CLIENT_URL}/login?oauth=error`);
    }
  };

  register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = RegisterDto.parse(req.body);
      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
      const ua = req.headers['user-agent'] || 'unknown';
      const result = await this.authService.register(dto, ip, ua);
      respondWithAuth(res, 201, result as unknown as Record<string, unknown>);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = LoginDto.parse(req.body);
      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
      const ua = req.headers['user-agent'] || 'unknown';
      const result = await this.authService.login(dto, ip, ua);
      respondWithAuth(res, 200, result as unknown as Record<string, unknown>);
    } catch (err) {
      next(err);
    }
  };

  refreshToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Prefer the HttpOnly cookie; fall back to the body for API clients.
      const token = req.cookies?.refreshToken ?? (req.body?.refreshToken as string | undefined);
      if (!token) {
        res.status(401).json({ success: false, message: 'No refresh token provided' });
        return;
      }
      const result = await this.authService.refreshToken(token);
      respondWithAuth(res, 200, result as unknown as Record<string, unknown>);
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user) await this.authService.logout(req.user.userId);
      clearAuthCookies(res);
      res.json({ success: true, message: 'Logged out' });
    } catch (err) {
      next(err);
    }
  };

  setupMfa = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.setupMfa(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  confirmMfa = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = VerifyMfaSetupDto.parse(req.body);
      const result = await this.authService.confirmMfaSetup(req.user!.userId, dto);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  disableMfa = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { password } = req.body as { password: string };
      await this.authService.disableMfa(req.user!.userId, password);
      res.json({ success: true, message: 'MFA disabled' });
    } catch (err) {
      next(err);
    }
  };

  me = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await this.userService.getProfile(req.user!.userId);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  };

  forgotPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body as { email: string };
      if (!email || typeof email !== 'string') {
        res.status(400).json({ success: false, message: 'Email is required' });
        return;
      }
      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
      const ua = req.headers['user-agent'] || 'unknown';
      await this.authService.forgotPassword(email.toLowerCase().trim(), ip, ua);
      res.json({ success: true, message: 'If that email exists, a reset code has been sent.' });
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, otp, password } = req.body as { email: string; otp: string; password: string };
      if (!email || !otp || !password) {
        res.status(400).json({ success: false, message: 'email, otp, and password are required' });
        return;
      }
      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
      const ua = req.headers['user-agent'] || 'unknown';
      await this.authService.resetPassword(email.toLowerCase().trim(), otp, password, ip, ua);
      res.json({ success: true, message: 'Password reset successfully.' });
    } catch (err) {
      next(err);
    }
  };
}
