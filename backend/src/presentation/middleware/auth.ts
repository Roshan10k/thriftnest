import type { Request, Response, NextFunction } from 'express';
import { JwtTokenService } from '../../infrastructure/services/JwtTokenService';
import { MongoUserRepository } from '../../infrastructure/repositories/MongoUserRepository';
import { AppError } from '../../application/errors/AppError';

const tokenService = new JwtTokenService();
const userRepo = new MongoUserRepository();

export interface AuthRequest extends Request {
  user?: { userId: string; email: string; role: string };
}

// Zero-trust: every request re-verifies the token AND re-checks the token
// version against the database, so a logout (which bumps tokenVersion)
// invalidates existing access tokens immediately, not just on expiry.
export async function authenticate(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  // Prefer the HttpOnly cookie; fall back to a Bearer header for API clients.
  const cookieToken = (req as AuthRequest & { cookies?: Record<string, string> }).cookies?.accessToken;
  const header = req.headers.authorization;
  const token = cookieToken ?? (header?.startsWith('Bearer ') ? header.slice(7) : undefined);
  if (!token) {
    return next(AppError.unauthorized('No token provided'));
  }
  try {
    const payload = tokenService.verifyAccessToken(token);
    const user = await userRepo.findById(payload.userId);
    if (!user || (payload.tokenVersion ?? 0) !== user.tokenVersion) {
      return next(AppError.unauthorized('Session is no longer valid'));
    }
    req.user = { userId: payload.userId, email: payload.email, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
}

// Populates req.user when a valid session is present, but never rejects — used
// on public endpoints (e.g. browse) that behave differently for logged-in users.
export async function optionalAuthenticate(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  const cookieToken = (req as AuthRequest & { cookies?: Record<string, string> }).cookies?.accessToken;
  const header = req.headers.authorization;
  const token = cookieToken ?? (header?.startsWith('Bearer ') ? header.slice(7) : undefined);
  if (!token) return next();
  try {
    const payload = tokenService.verifyAccessToken(token);
    const user = await userRepo.findById(payload.userId);
    if (user && (payload.tokenVersion ?? 0) === user.tokenVersion) {
      req.user = { userId: payload.userId, email: payload.email, role: user.role };
    }
  } catch {
    /* invalid token → treat as guest */
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden('Insufficient permissions'));
    }
    next();
  };
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) return next(AppError.unauthorized());
  if (req.user.role !== 'admin') return next(AppError.forbidden());
  next();
}
