import { randomInt } from 'node:crypto';

/**
 * Crockford's Base32 without the letters that are easy to misread or mishear
 * (I, L, O, U). References are read aloud on phone calls and typed from
 * screenshots, so every character has to survive both.
 */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function randomCode(length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

/**
 * Formats like `SAU-Q-7K3M-9QX2`: a prefix that tells staff what kind of record
 * it is, then 8 random characters (32^8 ≈ 1.1 trillion combinations) in two
 * groups of four. Uniqueness is still enforced by the database.
 */
export function reference(prefix: string): string {
  return `${prefix}-${randomCode(4)}-${randomCode(4)}`;
}

/** Retries a create when the random reference collides with an existing one. */
export async function withUniqueReference<T>(
  create: (ref: string) => Promise<T>,
  makeReference: () => string,
  isCollision: (error: unknown) => boolean,
  attempts = 4,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await create(makeReference());
    } catch (error) {
      if (!isCollision(error)) {
        throw error;
      }
      lastError = error;
    }
  }
  throw lastError;
}
