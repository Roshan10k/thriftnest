import type { User } from '../entities/User';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User | null>;
  delete(id: string): Promise<boolean>;
  findAll(options: PaginationOptions): Promise<{ users: User[]; total: number }>;
  updateLoginAttempts(id: string, attempts: number, lockUntil?: Date): Promise<void>;
  resetLoginAttempts(id: string): Promise<void>;
  updateMfa(id: string, secret: string, backupCodes: string[]): Promise<void>;
  disableMfa(id: string): Promise<void>;
  setPasswordResetOtp(email: string, otp: string, expiry: Date): Promise<void>;
  findWithPasswordResetOtp(email: string): Promise<{ otp: string; expiry: Date } | null>;
  clearPasswordResetOtp(email: string): Promise<void>;
}
