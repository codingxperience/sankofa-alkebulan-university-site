/**
 * Event times are entered and shown in the event's own time zone, whatever
 * zone the person at the keyboard happens to be in. These helpers convert
 * between an instant (ISO string) and the wall-clock text a
 * <input type="datetime-local"> holds for a given zone.
 */

const PART_FORMATS = new Map<string, Intl.DateTimeFormat>();

function partsFormat(zone: string): Intl.DateTimeFormat {
  let format = PART_FORMATS.get(zone);
  if (!format) {
    format = new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    PART_FORMATS.set(zone, format);
  }
  return format;
}

function wallClock(instant: number, zone: string): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const parts = Object.fromEntries(partsFormat(zone).formatToParts(new Date(instant)).map((part) => [part.type, part.value]));
  return {
    year: Number(parts['year']),
    month: Number(parts['month']),
    day: Number(parts['day']),
    hour: Number(parts['hour']),
    minute: Number(parts['minute']),
    second: Number(parts['second']),
  };
}

/** How far the zone's clocks are ahead of UTC at a given instant, in milliseconds. */
function offsetAt(instant: number, zone: string): number {
  const w = wallClock(instant, zone);
  return Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second) - Math.floor(instant / 1000) * 1000;
}

/** "2026-08-14T17:00" for an instant, as the clocks read in `zone`. */
export function toZonedInput(iso: string | null | undefined, zone: string): string {
  if (!iso) {
    return '';
  }
  const instant = new Date(iso).getTime();
  if (Number.isNaN(instant)) {
    return '';
  }
  const w = wallClock(instant, zone);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${w.year}-${pad(w.month)}-${pad(w.day)}T${pad(w.hour)}:${pad(w.minute)}`;
}

/** The instant at which clocks in `zone` read the given wall-clock text. Null for empty or malformed input. */
export function fromZonedInput(value: string, zone: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) {
    return null;
  }
  const [, y, mo, d, h, mi] = match.map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  // Two passes settle the offset correctly on either side of a daylight-saving change.
  let instant = asUtc - offsetAt(asUtc, zone);
  instant = asUtc - offsetAt(instant, zone);
  return new Date(instant).toISOString();
}

const ZONE_FORMATS = new Map<string, Intl.DateTimeFormat>();

/** "Fri 14 Aug 2026, 17:00 EAT" — a moment as the event's own clocks show it. */
export function formatInZone(iso: string | null | undefined, zone: string, withZone = true): string {
  if (!iso) {
    return '';
  }
  const key = `${zone}|${withZone}`;
  let format = ZONE_FORMATS.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...(withZone ? { timeZoneName: 'short' } : {}),
    });
    ZONE_FORMATS.set(key, format);
  }
  return format.format(new Date(iso));
}

/** Every zone the browser knows, for the time-zone picker. */
export function timeZones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return ['Africa/Kampala', 'Africa/Nairobi', 'Africa/Lagos', 'Africa/Accra', 'Africa/Johannesburg', 'Europe/London', 'America/New_York', 'UTC'];
  }
}
