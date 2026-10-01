import type { Request } from 'express';
import { parse as parseCookieHeader, serialize, type SerializeOptions } from 'cookie';

/**
 * The caller's IP address. Vercel overwrites `x-real-ip` and `x-forwarded-for`
 * at its edge, so on Vercel those headers can be trusted; anywhere else a
 * client could forge them, so the socket address is used instead.
 */
export function clientIp(req: Request): string {
  if (process.env.VERCEL === '1') {
    const real = req.headers['x-real-ip'];
    if (typeof real === 'string' && real) {
      return real.trim();
    }
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded) {
      return forwarded.split(',')[0].trim();
    }
  }
  return req.socket.remoteAddress ?? 'unknown';
}

export function userAgent(req: Request): string | undefined {
  const value = req.headers['user-agent'];
  return typeof value === 'string' ? value.slice(0, 400) : undefined;
}

export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) {
    return undefined;
  }
  return parseCookieHeader(header)[name] || undefined;
}

export function appendCookie(
  res: { append(field: string, value: string): unknown },
  name: string,
  value: string,
  options: SerializeOptions,
): void {
  res.append('Set-Cookie', serialize(name, value, options));
}
