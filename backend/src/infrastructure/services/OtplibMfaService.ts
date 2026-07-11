import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import type { IMfaService, MfaSetupResult } from '../../application/interfaces/IMfaService';

export class OtplibMfaService implements IMfaService {
  private readonly serviceName: string;

  constructor() {
    this.serviceName = process.env.TOTP_SERVICE_NAME ?? 'ThriftNest';
    authenticator.options = { window: 1 };
  }

  async generateSecret(email: string): Promise<MfaSetupResult> {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(email, this.serviceName, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    const backupCodes = this.generateBackupCodes();
    return { secret, otpauthUrl, qrCodeDataUrl, backupCodes };
  }

  verifyToken(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch {
      return false;
    }
  }

  generateBackupCodes(count = 8): string[] {
    return Array.from({ length: count }, () =>
      `TN-${randomBytes(2).toString('hex').toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`,
    );
  }

  async hashBackupCode(code: string): Promise<string> {
    return bcrypt.hash(code, 10);
  }

  async verifyBackupCode(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
