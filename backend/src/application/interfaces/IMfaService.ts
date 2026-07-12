export interface MfaSetupResult {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export interface IMfaService {
  generateSecret(email: string): Promise<MfaSetupResult>;
  verifyToken(secret: string, token: string): boolean;
  generateBackupCodes(count?: number): string[];
  hashBackupCode(code: string): Promise<string>;
  verifyBackupCode(plain: string, hashed: string): Promise<boolean>;
}
