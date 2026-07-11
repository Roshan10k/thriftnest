import { UserModel } from '../database/models/UserModel';
import type { IUserRepository, PaginationOptions } from '../../domain/repositories/IUserRepository';
import type { User } from '../../domain/entities/User';

function toEntity(doc: NonNullable<Awaited<ReturnType<typeof UserModel.findById>>>): User {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj = (doc as any).toObject({ virtuals: true }) as Record<string, unknown>;
  return {
    id: String(obj._id ?? obj.id),
    email: obj.email as string,
    passwordHash: obj.passwordHash as string,
    name: obj.name as string,
    avatar: obj.avatar as string | undefined,
    role: obj.role as User['role'],
    phone: obj.phone as string | undefined,
    location: obj.location as string | undefined,
    bio: obj.bio as string | undefined,
    verified: obj.verified as boolean,
    emailVerified: obj.emailVerified as boolean,
    mfaEnabled: obj.mfaEnabled as boolean,
    mfaSecret: obj.mfaSecret as string | undefined,
    backupCodes: (obj.backupCodes as string[]) ?? [],
    loginAttempts: obj.loginAttempts as number,
    lockUntil: obj.lockUntil as Date | undefined,
    tokenVersion: (obj.tokenVersion as number) ?? 0,
    rating: obj.rating as number,
    reviewCount: obj.reviewCount as number,
    responseRate: obj.responseRate as number,
    salesCount: obj.salesCount as number,
    purchaseCount: obj.purchaseCount as number,
    memberSince: obj.memberSince as Date,
    createdAt: obj.createdAt as Date,
    updatedAt: obj.updatedAt as Date,
  };
}

export class MongoUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).select('+mfaSecret +backupCodes');
    return doc ? toEntity(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() }).select('+mfaSecret +backupCodes');
    return doc ? toEntity(doc) : null;
  }

  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const doc = await UserModel.create(data);
    return toEntity(doc);
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const doc = await UserModel.findByIdAndUpdate(id, { $set: data }, { new: true }).select('+mfaSecret +backupCodes');
    return doc ? toEntity(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
  }

  async findAll(options: PaginationOptions): Promise<{ users: User[]; total: number }> {
    const skip = (options.page - 1) * options.limit;
    const [docs, total] = await Promise.all([
      UserModel.find().skip(skip).limit(options.limit).sort({ createdAt: -1 }),
      UserModel.countDocuments(),
    ]);
    return { users: docs.map(toEntity), total };
  }

  async updateLoginAttempts(id: string, attempts: number, lockUntil?: Date): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { $set: { loginAttempts: attempts, lockUntil } });
  }

  async resetLoginAttempts(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { $set: { loginAttempts: 0 }, $unset: { lockUntil: '' } });
  }

  async incrementTokenVersion(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { $inc: { tokenVersion: 1 } });
  }

  async updateMfa(id: string, secret: string, backupCodes: string[]): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { $set: { mfaEnabled: true, mfaSecret: secret, backupCodes } });
  }

  async disableMfa(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      $set: { mfaEnabled: false, backupCodes: [] },
      $unset: { mfaSecret: '' },
    });
  }

  async setPasswordResetOtp(email: string, otp: string, expiry: Date): Promise<void> {
    await UserModel.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: { passwordResetOtp: otp, passwordResetExpiry: expiry } },
    );
  }

  async findWithPasswordResetOtp(email: string): Promise<{ otp: string; expiry: Date } | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() }).select('+passwordResetOtp +passwordResetExpiry');
    if (!doc?.passwordResetOtp || !doc.passwordResetExpiry) return null;
    return { otp: doc.passwordResetOtp, expiry: doc.passwordResetExpiry };
  }

  async clearPasswordResetOtp(email: string): Promise<void> {
    await UserModel.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $unset: { passwordResetOtp: '', passwordResetExpiry: '' } },
    );
  }
}
