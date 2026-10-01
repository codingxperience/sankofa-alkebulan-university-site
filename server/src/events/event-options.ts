import { z } from 'zod';

/**
 * The choices an event's registration form offers. Stored on the event, so
 * the API only accepts answers the event actually lists.
 */
export const EventOptionsSchema = z.object({
  attendeeCategories: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  attendanceModes: z.array(z.string().trim().min(1).max(80)).max(10).default([]),
  days: z.array(z.string().trim().min(1).max(80)).max(10).default([]),
  interests: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
});

export type EventOptions = z.infer<typeof EventOptionsSchema>;

export function readOptions(value: unknown): EventOptions {
  const parsed = EventOptionsSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : { attendeeCategories: [], attendanceModes: [], days: [], interests: [] };
}

export type RegistrationState =
  | { open: true; waitlist: boolean }
  | { open: false; reason: 'not_published' | 'cancelled' | 'closed' | 'ended' };

export function registrationState(
  event: { status: string; startsAt: Date; endsAt: Date | null; registrationClosesAt: Date | null; capacity: number | null },
  confirmed: number,
  now = new Date(),
): RegistrationState {
  if (event.status === 'CANCELLED') return { open: false, reason: 'cancelled' };
  if (event.status !== 'PUBLISHED') return { open: false, reason: 'not_published' };
  const ends = event.endsAt ?? event.startsAt;
  if (ends <= now) return { open: false, reason: 'ended' };
  const closes = event.registrationClosesAt ?? event.startsAt;
  if (closes <= now) return { open: false, reason: 'closed' };
  return { open: true, waitlist: event.capacity !== null && confirmed >= event.capacity };
}
