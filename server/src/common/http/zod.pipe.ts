import { Injectable, PipeTransform } from '@nestjs/common';
import type { z } from 'zod';
import { unprocessable } from './errors';

/**
 * Validates and normalises a request body or query against a zod schema.
 * On failure the client gets every problem at once, keyed by field path, so
 * a form can mark all invalid inputs in one round trip.
 */
@Injectable()
export class ZodPipe<S extends z.ZodType> implements PipeTransform<unknown, z.output<S>> {
  constructor(private readonly schema: S) {}

  transform(value: unknown): z.output<S> {
    const result = this.schema.safeParse(value ?? {});
    if (result.success) {
      return result.data;
    }
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.length ? issue.path.join('.') : '_';
      fields[key] ??= issue.message;
    }
    const first = Object.values(fields)[0];
    throw unprocessable(first ?? 'Please check the highlighted fields.', fields);
  }
}

export const validate = <S extends z.ZodType>(schema: S) => new ZodPipe(schema);
