/**
 * Symmetric encryption of sensitive data at rest (e.g. the TOTP/MFA secret).
 * Passwords are one-way hashed, not encrypted — this port is for values the
 * server must be able to read back, but which must never sit in the database
 * in plaintext.
 */
export interface ICryptoService {
  /** Encrypts a UTF-8 string, returning a self-describing ciphertext token. */
  encrypt(plaintext: string): string;
  /** Reverses {@link encrypt}; throws if the token was tampered with. */
  decrypt(payload: string): string;
}
