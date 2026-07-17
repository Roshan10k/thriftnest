import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import type { ICryptoService } from '../../application/interfaces/ICryptoService';

// AES-256 in Galois/Counter Mode: authenticated encryption, so a tampered
// ciphertext fails to decrypt rather than silently returning garbage.
const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12; // 96-bit nonce, the recommended size for GCM
const KEY_HEX_LEN = 64; // 32 bytes = 256 bits, expressed as hex

/**
 * Reads the 256-bit key from ENCRYPTION_KEY (64 hex chars). Kept as a function
 * (not a module constant) so the process fails loudly at first use if the key
 * is missing/short, rather than booting with a broken crypto config.
 */
function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.length < KEY_HEX_LEN) {
    throw new Error(
      'ENCRYPTION_KEY must be set to a 32-byte value encoded as 64 hex characters',
    );
  }
  return Buffer.from(raw.slice(0, KEY_HEX_LEN), 'hex');
}

export class AesCryptoService implements ICryptoService {
  // Stored form: "<iv>:<authTag>:<ciphertext>", each part hex-encoded. The IV is
  // random per call, so encrypting the same value twice yields different tokens.
  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, getKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
  }

  decrypt(payload: string): string {
    const [ivHex, tagHex, dataHex] = payload.split(':');
    if (!ivHex || !tagHex || !dataHex) {
      throw new Error('Malformed ciphertext');
    }
    const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ]).toString('utf8');
  }
}
