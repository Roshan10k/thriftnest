import { allowlistedFetch } from '../http/allowlistedFetch';
import { AppError } from '../../application/errors/AppError';

// Fixed Google OAuth 2.0 endpoints (all on the SSRF allowlist). We run the
// authorization-code flow ourselves — no prebuilt auth SDK/service is used.
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';

export interface GoogleProfile {
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
}

export class GoogleOAuthService {
  private readonly clientId = process.env.GOOGLE_CLIENT_ID ?? '';
  private readonly clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';
  private readonly redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI ?? '';

  /** True only when all three credentials are present, so routes can 503 cleanly. */
  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret && this.redirectUri);
  }

  /** Step 1: the Google consent-screen URL the browser is redirected to. */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'online',
      prompt: 'select_account',
    });
    return `${AUTH_ENDPOINT}?${params.toString()}`;
  }

  /** Steps 2–3: exchange the auth code for a token, then read the profile. */
  async exchangeCodeForProfile(code: string): Promise<GoogleProfile> {
    const tokenRes = await allowlistedFetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });
    if (!tokenRes.ok) throw new AppError('Google token exchange failed', 502);
    const tokenJson = (await tokenRes.json()) as { access_token?: string };
    if (!tokenJson.access_token) throw new AppError('Google token exchange failed', 502);

    const infoRes = await allowlistedFetch(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    if (!infoRes.ok) throw new AppError('Failed to fetch Google profile', 502);
    const info = (await infoRes.json()) as {
      email?: string;
      name?: string;
      picture?: string;
      email_verified?: boolean;
    };
    if (!info.email) throw new AppError('Google account did not return an email', 400);

    return {
      email: info.email.toLowerCase().trim(),
      name: info.name?.trim() || info.email,
      avatar: info.picture,
      emailVerified: Boolean(info.email_verified),
    };
  }
}
