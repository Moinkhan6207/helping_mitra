import crypto from 'crypto';
import { env } from '../../config/env';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY || env.JWT_ACCESS_SECRET || 'helping-mitra-fallback-encryption-secret-key-32').digest();

/**
 * Encrypts a plaintext string to cipher text at rest.
 * Returns in format: "iv_hex:ciphertext_hex"
 */
export function encrypt(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts a ciphertext string back to plaintext.
 * Expects format: "iv_hex:ciphertext_hex"
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) return '';
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    console.error('Decryption failed:', e);
    return '';
  }
}
