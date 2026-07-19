export type UserRole = 'buyer' | 'seller' | 'both' | 'admin';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  passwordHistory?: string[];
  name: string;
  avatar?: string;
  role: UserRole;
  phone?: string;
  location?: string;
  bio?: string;
  verified: boolean;
  emailVerified: boolean;
  suspended?: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  backupCodes: string[];
  loginAttempts: number;
  lockUntil?: Date;
  tokenVersion: number;
  passwordChangedAt?: Date;
  rating: number;
  reviewCount: number;
  responseRate: number;
  salesCount: number;
  purchaseCount: number;
  memberSince: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function isLocked(user: User): boolean {
  return !!(user.lockUntil && user.lockUntil > new Date());
}

// A password is treated as expired 90 days after it was last set. Accounts
// created (or reset) before this field existed have no passwordChangedAt, and
// are deliberately NOT treated as expired — there is no genuine age to enforce
// against for them, and failing open here avoids locking out every pre-existing
// account the moment this feature ships.
const PASSWORD_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

export function isPasswordExpired(user: User): boolean {
  if (!user.passwordChangedAt) return false;
  return Date.now() - user.passwordChangedAt.getTime() > PASSWORD_MAX_AGE_MS;
}

// Locks the account for 15 minutes after 10 consecutive failed logins.
// (Coursework requires a 10–15 attempt threshold; a dedicated IP rate limiter
// on the auth routes provides a second, earlier layer of brute-force defence.)
export function incrementLoginAttempts(user: Partial<User>, maxAttempts = 10): Partial<User> {
  const attempts = (user.loginAttempts ?? 0) + 1;
  const updates: Partial<User> = { loginAttempts: attempts };
  if (attempts >= maxAttempts) {
    updates.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  return updates;
}
