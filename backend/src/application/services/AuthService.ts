import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import type { IActivityLogRepository } from '../../domain/repositories/IActivityLogRepository';
import type { IHashService } from '../interfaces/IHashService';
import type { ITokenService } from '../interfaces/ITokenService';
import type { IEmailService } from '../interfaces/IEmailService';
import type { IMfaService } from '../interfaces/IMfaService';
import type { ICryptoService } from '../interfaces/ICryptoService';
import { isLocked, incrementLoginAttempts, isPasswordExpired } from '../../domain/entities/User';
import type { RegisterDtoType, LoginDtoType, VerifyMfaSetupDtoType } from '../dtos/auth.dto';
import { AppError } from '../errors/AppError';
import { randomBytes } from 'crypto';

export class AuthService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly activityLogRepo: IActivityLogRepository,
    private readonly hashService: IHashService,
    private readonly tokenService: ITokenService,
    private readonly emailService: IEmailService,
    private readonly mfaService: IMfaService,
    private readonly cryptoService: ICryptoService,
  ) {}

  // The MFA secret is stored AES-encrypted at rest. Older test accounts may
  // still hold a plaintext secret (no "iv:tag:ciphertext" structure), so fall
  // back to treating an unrecognised value as plaintext rather than failing.
  private readMfaSecret(stored: string): string {
    if (stored.split(':').length === 3) {
      try {
        return this.cryptoService.decrypt(stored);
      } catch {
        return stored;
      }
    }
    return stored;
  }

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

  // Logs a user in via a verified Google profile (authorization-code flow run in
  // GoogleOAuthService). Finds the existing account by email or provisions a new
  // one, then issues the same session tokens as a normal login. New OAuth users
  // get an unusable random password hash (they authenticate through Google) and
  // default to the buyer role. Google is the identity provider here, so the
  // app's own MFA is not re-challenged on this path.
  async loginWithGoogle(
    profile: { email: string; name: string; avatar?: string },
    ipAddress: string,
    userAgent: string,
  ) {
    let user = await this.userRepo.findByEmail(profile.email);

    if (user) {
      if (user.suspended) {
        throw new AppError('Your account has been suspended. Please contact support.', 403);
      }
    } else {
      const randomPassword = randomBytes(32).toString('hex');
      const passwordHash = await this.hashService.hash(randomPassword);
      user = await this.userRepo.create({
        email: profile.email,
        passwordHash,
        name: profile.name,
        role: 'buyer',
        avatar: profile.avatar,
        verified: false,
        emailVerified: true,
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
    }

    await this.activityLogRepo.create({
      userId: user.id,
      action: 'login_google',
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

    // Password expiry (90 days). Blocking here rather than allowing login with
    // a stale password reuses the existing forgot-password/OTP flow as the
    // remediation path, rather than building a second "change password before
    // continuing" flow for what should be a rare event.
    if (isPasswordExpired(user)) {
      await this.activityLogRepo.create({
        userId: user.id,
        action: 'login_blocked_password_expired',
        ipAddress,
        userAgent,
        status: 'failed',
      });
      throw new AppError('Your password has expired and must be reset. Please use "Forgot password" to set a new one.', 403);
    }

    if (user.mfaEnabled) {
      if (!dto.mfaToken && !dto.backupCode) {
        return { mfaRequired: true, userId: user.id };
      }
      if (dto.mfaToken) {
        const valid = this.mfaService.verifyToken(this.readMfaSecret(user.mfaSecret!), dto.mfaToken);
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

    // Encrypt the TOTP secret before it touches the database.
    const encryptedSecret = this.cryptoService.encrypt(dto.secret);
    await this.userRepo.updateMfa(userId, encryptedSecret, hashedCodes);
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
    await this.userRepo.update(user.id, { passwordHash, passwordHistory, passwordChangedAt: new Date() });
    await this.userRepo.clearPasswordResetOtp(email);
    await this.userRepo.resetLoginAttempts(user.id);
    // A password reset is exactly the situation session revocation exists
    // for — it typically means the account may have been compromised, so any
    // session established before the reset (e.g. an attacker's) must not
    // survive it.
    await this.userRepo.incrementTokenVersion(user.id);

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
