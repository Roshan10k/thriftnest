import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { AuthService } from '../../application/services/AuthService';
import { UserService } from '../../application/services/UserService';
import { RegisterDto, LoginDto, VerifyMfaSetupDto } from '../../application/dtos/auth.dto';

const isProduction = process.env.NODE_ENV === 'production';
const ACCESS_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// HttpOnly cookies keep tokens out of reach of client-side JavaScript (XSS).
// SameSite=Lax blocks cross-site sends; Secure is enabled outside development.
function baseCookie() {
  return { httpOnly: true, secure: isProduction, sameSite: 'lax' as const, path: '/' };
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
  ) {}

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
