import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import type { IActivityLogRepository } from '../../domain/repositories/IActivityLogRepository';
import type { IHashService } from '../interfaces/IHashService';
import type { ITokenService } from '../interfaces/ITokenService';
import type { IEmailService } from '../interfaces/IEmailService';
import type { IMfaService } from '../interfaces/IMfaService';
import { isLocked, incrementLoginAttempts } from '../../domain/entities/User';
import type { RegisterDtoType, LoginDtoType, VerifyMfaSetupDtoType } from '../dtos/auth.dto';
import { AppError } from '../errors/AppError';

export class AuthService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly activityLogRepo: IActivityLogRepository,
    private readonly hashService: IHashService,
    private readonly tokenService: ITokenService,
    private readonly emailService: IEmailService,
    private readonly mfaService: IMfaService,
  ) {}

  async register(dto: RegisterDtoType, ipAddress: string, userAgent: string) {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) throw new AppError('Email already registered', 409);

    const passwordHash = await this.hashService.hash(dto.password);

    const user = await this.userRepo.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      role: dto.role,
      phone: dto.phone,
      location: dto.location,
      verified: false,
      emailVerified: false,
      mfaEnabled: false,
      backupCodes: [],
      loginAttempts: 0,
      tokenVersion: 0,
      rating: 0,
      reviewCount: 0,
      responseRate: 0,
      salesCount: 0,
      purchaseCount: 0,
      memberSince: new Date(),
    });

    await this.activityLogRepo.create({
      userId: user.id,
      action: 'account_registered',
      ipAddress,
      userAgent,
      status: 'success',
    });

    const tokens = this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    return { user: this.sanitize(user), ...tokens };
  }

  async login(dto: LoginDtoType, ipAddress: string, userAgent: string) {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) throw new AppError('Invalid email or password', 401);

    if (isLocked(user)) {
      throw new AppError('Account temporarily locked due to too many failed attempts. Try again in 15 minutes.', 423);
    }

    const passwordMatch = await this.hashService.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      const updates = incrementLoginAttempts(user);
      await this.userRepo.updateLoginAttempts(user.id, updates.loginAttempts!, updates.lockUntil);
      await this.activityLogRepo.create({
        userId: user.id,
        action: 'login_failed',
        ipAddress,
        userAgent,
        status: 'failed',
        metadata: { reason: 'wrong_password', attempts: updates.loginAttempts },
      });
      throw new AppError('Invalid email or password', 401);
    }

    if (user.suspended) {
      await this.activityLogRepo.create({
        userId: user.id,
        action: 'login_blocked_suspended',
        ipAddress,
        userAgent,
        status: 'failed',
      });
      throw new AppError('Your account has been suspended. Please contact support.', 403);
    }

    if (user.mfaEnabled) {
      if (!dto.mfaToken && !dto.backupCode) {
        return { mfaRequired: true, userId: user.id };
      }
      if (dto.mfaToken) {
        const valid = this.mfaService.verifyToken(user.mfaSecret!, dto.mfaToken);
        if (!valid) {
          await this.activityLogRepo.create({
            userId: user.id,
            action: 'login_mfa_failed',
            ipAddress,
            userAgent,
            status: 'failed',
          });
          throw new AppError('Invalid MFA token', 401);
        }
      } else if (dto.backupCode) {
        const matched = await Promise.all(
          user.backupCodes.map((hashed) => this.mfaService.verifyBackupCode(dto.backupCode!, hashed)),
        );
        const matchIndex = matched.findIndex(Boolean);
        if (matchIndex === -1) throw new AppError('Invalid backup code', 401);
        const updatedCodes = user.backupCodes.filter((_, i) => i !== matchIndex);
        await this.userRepo.update(user.id, { backupCodes: updatedCodes });
      }
    }

    await this.userRepo.resetLoginAttempts(user.id);
    await this.activityLogRepo.create({
      userId: user.id,
      action: 'login_success',
      ipAddress,
      userAgent,
      status: 'success',
    });

    const tokens = this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    return { user: this.sanitize(user), ...tokens };
  }

  async refreshToken(refreshToken: string) {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    const user = await this.userRepo.findById(payload.userId);
    if (!user) throw new AppError('User not found', 404);
    // Reject refresh tokens minted before the last logout / credential change.
    if ((payload.tokenVersion ?? 0) !== user.tokenVersion) {
      throw new AppError('Session has been invalidated. Please log in again.', 401);
    }
    const tokens = this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });
    return { user: this.sanitize(user), ...tokens };
  }

  async logout(userId: string) {
    // Bumping the token version invalidates every previously-issued refresh
    // token for this user (server-side session revocation).
    await this.userRepo.incrementTokenVersion(userId);
  }

  async setupMfa(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    if (user.mfaEnabled) throw new AppError('MFA already enabled', 400);
    return this.mfaService.generateSecret(user.email);
  }

  async confirmMfaSetup(userId: string, dto: VerifyMfaSetupDtoType) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const valid = this.mfaService.verifyToken(dto.secret, dto.token);
    if (!valid) throw new AppError('Invalid MFA token', 400);

    const rawCodes = this.mfaService.generateBackupCodes();
    const hashedCodes = await Promise.all(rawCodes.map((c) => this.mfaService.hashBackupCode(c)));

    await this.userRepo.updateMfa(userId, dto.secret, hashedCodes);
    return { backupCodes: rawCodes };
  }

  async disableMfa(userId: string, password: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    const match = await this.hashService.compare(password, user.passwordHash);
    if (!match) throw new AppError('Incorrect password', 401);
    await this.userRepo.disableMfa(userId);
  }

  async forgotPassword(email: string, ipAddress: string, userAgent: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) return; // don't reveal whether email exists

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await this.userRepo.setPasswordResetOtp(email, otp, expiry);

    // Always log OTP to console in development (in case SMTP is not configured)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Password reset OTP for ${email}: ${otp} (expires in 10 min)`);
    }

    try {
      await this.emailService.sendPasswordReset(email, user.name, otp);
    } catch (emailErr) {
      console.error('[WARN] Failed to send password reset email:', (emailErr as Error).message);
      // Don't throw — OTP is already saved, user can get it from console in dev
    }

    await this.activityLogRepo.create({
      userId: user.id,
      action: 'password_reset_requested',
      ipAddress,
      userAgent,
      status: 'success',
    });
  }

  async resetPassword(email: string, otp: string, newPassword: string, ipAddress: string, userAgent: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new AppError('Invalid request', 400);

    const resetData = await this.userRepo.findWithPasswordResetOtp(email);
    if (!resetData) throw new AppError('No password reset was requested', 400);
    if (new Date() > resetData.expiry) throw new AppError('OTP has expired. Please request a new one.', 400);
    if (resetData.otp !== otp) throw new AppError('Invalid OTP', 400);

    // Reuse prevention: block resetting to the current or a recent password.
    const previousHashes = await this.userRepo.getPasswordHashes(user.id);
    for (const hash of previousHashes) {
      if (await this.hashService.compare(newPassword, hash)) {
        throw new AppError('You cannot reuse a recent password. Please choose a different one.', 400);
      }
    }

    const passwordHash = await this.hashService.hash(newPassword);
    const passwordHistory = previousHashes.slice(0, 5);
    await this.userRepo.update(user.id, { passwordHash, passwordHistory });
    await this.userRepo.clearPasswordResetOtp(email);
    await this.userRepo.resetLoginAttempts(user.id);

    await this.activityLogRepo.create({
      userId: user.id,
      action: 'password_reset_completed',
      ipAddress,
      userAgent,
      status: 'success',
    });
  }

  private sanitize(user: NonNullable<Awaited<ReturnType<IUserRepository['findById']>>>) {
    const { passwordHash, mfaSecret, backupCodes, ...safe } = user as unknown as Record<string, unknown>;
    void passwordHash; void mfaSecret; void backupCodes;
    return safe;
  }
}
