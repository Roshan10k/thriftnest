import jwt from 'jsonwebtoken';
import type { ITokenService, TokenPayload, AuthTokens } from '../../application/interfaces/ITokenService';
import { AppError } from '../../application/errors/AppError';

export class JwtTokenService implements ITokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpires: string;
  private readonly refreshExpires: string;

  constructor() {
    this.accessSecret = process.env.JWT_SECRET!;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET!;
    this.accessExpires = process.env.JWT_ACCESS_EXPIRES ?? '15m';
    this.refreshExpires = process.env.JWT_REFRESH_EXPIRES ?? '7d';
  }

  generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpires as jwt.SignOptions['expiresIn'],
    });
    const refreshToken = jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpires as jwt.SignOptions['expiresIn'],
    });
    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.accessSecret) as TokenPayload;
    } catch {
      throw AppError.unauthorized('Invalid or expired access token');
    }
  }

  verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.refreshSecret) as TokenPayload;
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }
  }
}
