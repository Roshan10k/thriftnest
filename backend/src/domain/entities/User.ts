export type UserRole = 'buyer' | 'seller' | 'both';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  avatar?: string;
  role: UserRole;
  phone?: string;
  location?: string;
  bio?: string;
  verified: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  backupCodes: string[];
  loginAttempts: number;
  lockUntil?: Date;
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

export function incrementLoginAttempts(user: Partial<User>, maxAttempts = 5): Partial<User> {
  const attempts = (user.loginAttempts ?? 0) + 1;
  const updates: Partial<User> = { loginAttempts: attempts };
  if (attempts >= maxAttempts) {
    updates.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  return updates;
}
