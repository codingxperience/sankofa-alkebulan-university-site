import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp } from '../../src/bootstrap';
import { PrismaService } from '../../src/database/prisma.service';

/**
 * Boots the real API — same middleware, guards and database — on a random
 * local port, against the test database named in .env.test.
 */
export interface Harness {
  readonly url: string;
  readonly prisma: PrismaService;
  close(): Promise<void>;
}

export async function startApi(): Promise<Harness> {
  // Trust forwarded client addresses exactly as the API does behind Vercel's edge.
  process.env.VERCEL = '1';
  if (!process.env.DATABASE_URL?.includes('test')) {
    throw new Error('Refusing to run tests against a database whose name does not contain "test".');
  }
  const { app } = await createApp();
  const server: Server = await app.listen(0, '127.0.0.1');
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}/api`,
    prisma: app.get(PrismaService),
    close: () => app.close(),
  };
}

/** Empties every table, so each test file starts from nothing. */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'sankofa' AND tablename <> '_prisma_migrations'
  `;
  const list = tables.map((t) => `"sankofa"."${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
}

let nextAddress = 1;

/**
 * A tiny browser: keeps cookies between calls and sends JSON like the site
 * does. Each client gets its own address, the way separate visitors reach the
 * API through Vercel's edge, so one test's traffic does not use up another's
 * rate limits.
 */
export class Client {
  private readonly cookies = new Map<string, string>();
  private readonly address = `10.${(nextAddress >> 16) & 255}.${(nextAddress >> 8) & 255}.${nextAddress++ & 255}`;

  constructor(
    private readonly base: string,
    private readonly defaults: Record<string, string> = { 'Sec-Fetch-Site': 'same-origin' },
  ) {}

  async request<T = any>(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
    const response = await fetch(`${this.base}${path}`, {
      method,
      headers: {
        'X-Real-IP': this.address,
        ...this.defaults,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(this.cookies.size ? { Cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ') } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    for (const header of response.headers.getSetCookie()) {
      const [pair] = header.split(';');
      const index = pair.indexOf('=');
      const name = pair.slice(0, index);
      const value = pair.slice(index + 1);
      if (value === '' || /max-age=0/i.test(header)) {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
    const text = await response.text();
    let data: T;
    try {
      data = (text ? JSON.parse(text) : undefined) as T;
    } catch {
      data = text as unknown as T;
    }
    return { status: response.status, headers: response.headers, data };
  }

  get<T = any>(path: string, headers?: Record<string, string>) {
    return this.request<T>('GET', path, undefined, headers);
  }

  post<T = any>(path: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>('POST', path, body ?? {}, headers);
  }

  put<T = any>(path: string, body: unknown) {
    return this.request<T>('PUT', path, body);
  }

  patch<T = any>(path: string, body: unknown) {
    return this.request<T>('PATCH', path, body);
  }

  delete<T = any>(path: string) {
    return this.request<T>('DELETE', path);
  }
}

export const STRONG_PASSWORD = 'rivers carry the memory of mountains';
