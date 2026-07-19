/**
 * SSRF defence for outbound requests.
 *
 * The application only ever needs to call a small, fixed set of Google OAuth
 * endpoints. This wrapper refuses any outbound request whose host is not on the
 * allowlist (and any non-HTTPS request), so even if a bug or a future change
 * were to let user input influence an outbound URL, it could not be pointed at
 * an internal address (169.254.169.254, localhost, the Docker network, …) or an
 * arbitrary attacker host. User-supplied URLs are never fetched by the server;
 * this allowlist is the belt-and-braces guarantee of that.
 */
const ALLOWED_HOSTS = new Set([
  'accounts.google.com',
  'oauth2.googleapis.com',
  'www.googleapis.com',
  'openidconnect.googleapis.com',
]);

export async function allowlistedFetch(url: string, init?: RequestInit): Promise<Response> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Refusing to fetch a malformed outbound URL');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`Refusing non-HTTPS outbound request (${parsed.protocol})`);
  }
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    throw new Error(`Outbound host not in allowlist: ${parsed.hostname}`);
  }
  return fetch(url, init);
}
