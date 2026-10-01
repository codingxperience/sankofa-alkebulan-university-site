import { randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from 'node:crypto';

/**
 * Password hashing with scrypt from Node's standard library — no native
 * add-ons to break on a serverless build. Parameters follow the OWASP
 * Password Storage Cheat Sheet (N=2^15, r=8, p=3: 32 MiB per hash).
 *
 * Hashes are stored self-describing, `scrypt$ln=15,r=8,p=3$<salt>$<key>`, so the
 * cost can be raised later and old hashes upgraded on the next sign-in.
 */
const CURRENT = { ln: 15, r: 8, p: 3 } as const;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

interface Params {
  ln: number;
  r: number;
  p: number;
}

function derive(password: string, salt: Buffer, params: Params): Promise<Buffer> {
  const N = 2 ** params.ln;
  const options: ScryptOptions = {
    N,
    r: params.r,
    p: params.p,
    maxmem: 128 * N * params.r * 2,
  };
  return new Promise((resolve, reject) => {
    scryptCallback(password.normalize('NFKC'), salt, KEY_LENGTH, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

function parse(stored: string): { params: Params; salt: Buffer; key: Buffer } | null {
  const match = /^scrypt\$ln=(\d+),r=(\d+),p=(\d+)\$([A-Za-z0-9_-]+)\$([A-Za-z0-9_-]+)$/.exec(stored);
  if (!match) {
    return null;
  }
  const params = { ln: Number(match[1]), r: Number(match[2]), p: Number(match[3]) };
  if (params.ln < 10 || params.ln > 20 || params.r < 1 || params.r > 32 || params.p < 1 || params.p > 16) {
    return null;
  }
  return {
    params,
    salt: Buffer.from(match[4], 'base64url'),
    key: Buffer.from(match[5], 'base64url'),
  };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await derive(password, salt, CURRENT);
  return `scrypt$ln=${CURRENT.ln},r=${CURRENT.r},p=${CURRENT.p}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parsed = parse(stored);
  if (!parsed) {
    return false;
  }
  const candidate = await derive(password, parsed.salt, parsed.params);
  return candidate.length === parsed.key.length && timingSafeEqual(candidate, parsed.key);
}

export function needsRehash(stored: string): boolean {
  const parsed = parse(stored);
  return (
    !parsed ||
    parsed.params.ln < CURRENT.ln ||
    parsed.params.r !== CURRENT.r ||
    parsed.params.p < CURRENT.p
  );
}

/**
 * A hash of a random password, computed once. Signing in as an unknown email
 * still pays the full scrypt cost against it, so response timing does not
 * reveal which addresses have staff accounts.
 */
let decoyHash: Promise<string> | undefined;
export function decoyPasswordHash(): Promise<string> {
  decoyHash ??= hashPassword(randomBytes(24).toString('base64url'));
  return decoyHash;
}
