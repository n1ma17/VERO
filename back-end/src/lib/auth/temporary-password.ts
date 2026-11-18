import { randomBytes } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const LENGTH = 12;

/** Random password that meets Better Auth's 8-character minimum. */
export function generateTemporaryPassword(): string {
  const bytes = randomBytes(LENGTH);
  let out = '';
  for (const byte of bytes) {
    out += ALPHABET[byte % ALPHABET.length];
  }
  return out;
}
