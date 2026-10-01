import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/** 256 bits of randomness, URL-safe. Used for session, resume and order keys. */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/**
 * Tokens are stored only as SHA-256 digests. A leaked database row cannot be
 * replayed as a cookie or link, and a high-entropy token needs no salt.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function hmac(secret: string, ...parts: string[]): string {
  const mac = createHmac('sha256', secret);
  for (const part of parts) {
    mac.update(part, 'utf8');
    mac.update('\u0000');
  }
  return mac.digest('base64url');
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  return left.length === right.length && timingSafeEqual(left, right);
}
