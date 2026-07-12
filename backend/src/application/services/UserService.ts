import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import type { IStorageService } from '../interfaces/IStorageService';
import type { IHashService } from '../interfaces/IHashService';
import type { UpdateProfileDtoType, ChangePasswordDtoType } from '../dtos/user.dto';
import { AppError } from '../errors/AppError';

// Number of previous password hashes retained to block reuse.
const PASSWORD_HISTORY_SIZE = 5;

export class UserService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly storageService: IStorageService,
    private readonly hashService: IHashService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw AppError.notFound('User');
    return this.sanitize(user);
  }

  async getPublicProfile(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw AppError.notFound('User');
    const rec = user as unknown as Record<string, unknown>;
    const { email, phone, passwordHash, mfaSecret, backupCodes, loginAttempts, lockUntil, emailVerified, ...pub } = rec;
    void email; void phone; void passwordHash; void mfaSecret; void backupCodes;
    void loginAttempts; void lockUntil; void emailVerified;
    return pub;
  }

  async updateProfile(userId: string, dto: UpdateProfileDtoType) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw AppError.notFound('User');
    const updated = await this.userRepo.update(userId, dto);
    return this.sanitize(updated!);
  }

  async updateAvatar(userId: string, fileBuffer: Buffer) {
    const { url } = await this.storageService.upload(fileBuffer, 'avatars');
    const updated = await this.userRepo.update(userId, { avatar: url });
    return { avatar: updated!.avatar };
  }

  async changePassword(userId: string, dto: ChangePasswordDtoType) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw AppError.notFound('User');

    const match = await this.hashService.compare(dto.currentPassword, user.passwordHash);
    if (!match) throw new AppError('Current password is incorrect', 400);

    // Reuse prevention: reject the new password if it matches the current one
    // or any of the recent historical hashes.
    const previousHashes = await this.userRepo.getPasswordHashes(userId);
    for (const hash of previousHashes) {
      if (await this.hashService.compare(dto.newPassword, hash)) {
        throw new AppError('You cannot reuse a recent password. Please choose a different one.', 400);
      }
    }

    const passwordHash = await this.hashService.hash(dto.newPassword);
    // Keep the last PASSWORD_HISTORY_SIZE hashes (the just-replaced one first).
    const passwordHistory = previousHashes.slice(0, PASSWORD_HISTORY_SIZE);
    await this.userRepo.update(userId, { passwordHash, passwordHistory });
  }

  async deleteAccount(userId: string, password: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw AppError.notFound('User');
    const match = await this.hashService.compare(password, user.passwordHash);
    if (!match) throw new AppError('Incorrect password', 401);
    await this.userRepo.delete(userId);
  }

  private sanitize(user: NonNullable<Awaited<ReturnType<IUserRepository['findById']>>>) {
    const { passwordHash, mfaSecret, backupCodes, ...safe } = user as unknown as Record<string, unknown>;
    void passwordHash; void mfaSecret; void backupCodes;
    return safe;
  }
}
