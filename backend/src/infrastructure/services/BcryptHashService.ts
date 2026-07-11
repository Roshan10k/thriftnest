import bcrypt from 'bcryptjs';
import type { IHashService } from '../../application/interfaces/IHashService';

export class BcryptHashService implements IHashService {
  private readonly rounds: number;

  constructor() {
    this.rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
  }

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
