import { z } from 'zod';
import { line } from '../common/validation/fields';

/** Left out, a title is unchanged; null or an empty string clears it. */
export const staffTitle = z
  .string()
  .max(120, 'Title must be at most 120 characters.')
  .nullable()
  .optional()
  .transform((value) => (value === undefined ? undefined : value?.replace(/\s+/g, ' ').trim() || null));

/** What anyone may change about themselves. */
export const ProfileBody = z
  .object({ name: line('Name', 120, 2).optional(), title: staffTitle })
  .refine((body) => body.name !== undefined || body.title !== undefined, 'Nothing to change.');
