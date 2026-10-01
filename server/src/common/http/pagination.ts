import { z } from 'zod';
import { badRequest } from './errors';

/**
 * Keyset pagination. A cursor is the (createdAt, id) of the last row a client
 * saw, so every page is an index range scan — page 500 costs the same as page 1,
 * and rows inserted while someone is paging never shift or duplicate results.
 */
export interface Cursor {
  readonly at: Date;
  readonly id: string;
}

export function encodeCursor(row: { createdAt: Date; id: string }): string {
  return Buffer.from(`${row.createdAt.toISOString()}|${row.id}`, 'utf8').toString('base64url');
}

export function decodeCursor(value: string | undefined): Cursor | undefined {
  if (!value) {
    return undefined;
  }
  const decoded = Buffer.from(value, 'base64url').toString('utf8');
  const [iso, id] = decoded.split('|');
  const at = new Date(iso ?? '');
  if (!id || Number.isNaN(at.getTime()) || !/^[0-9a-f-]{36}$/i.test(id)) {
    throw badRequest('That page link is no longer valid.', 'invalid_cursor');
  }
  return { at, id };
}

/** Prisma `where` fragment selecting rows strictly after the cursor in (createdAt desc, id desc) order. */
export function afterCursor(cursor: Cursor | undefined) {
  if (!cursor) {
    return {};
  }
  return {
    OR: [{ createdAt: { lt: cursor.at } }, { createdAt: cursor.at, id: { lt: cursor.id } }],
  };
}

export interface Page<T> {
  readonly items: T[];
  readonly nextCursor: string | null;
}

/** Fetch `limit + 1` rows; the extra one only tells us whether another page exists. */
export function toPage<T extends { createdAt: Date; id: string }, R>(
  rows: T[],
  limit: number,
  map: (row: T) => R,
): Page<R> {
  const hasMore = rows.length > limit;
  const visible = hasMore ? rows.slice(0, limit) : rows;
  return {
    items: visible.map(map),
    nextCursor: hasMore ? encodeCursor(visible[visible.length - 1]) : null,
  };
}

export const pageQuery = {
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
};
