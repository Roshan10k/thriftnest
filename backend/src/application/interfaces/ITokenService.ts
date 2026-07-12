export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  tokenVersion?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ITokenService {
  generateTokens(payload: TokenPayload): AuthTokens;
  verifyAccessToken(token: string): TokenPayload;
  verifyRefreshToken(token: string): TokenPayload;
}
