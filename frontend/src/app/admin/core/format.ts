import { Pipe, PipeTransform } from '@angular/core';

/**
 * Dates, times and money as the console writes them: day before month,
 * 24-hour clock, the viewer's own time zone. One formatter per style,
 * built once — Intl formatters are expensive to create.
 */
const FORMATS = {
  date: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
  short: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
  full: new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  time: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }),
  day: new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
} as const;

export type DateStyle = keyof typeof FORMATS;

export function formatDate(value: string | Date | null | undefined, style: DateStyle = 'short'): string {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : FORMATS[style].format(date);
}

/** "just now", "12 min ago", "3 h ago", "yesterday", "4 days ago", then the date. */
export function relativeTime(value: string | Date | null | undefined, now = new Date()): string {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 0) {
    return formatDate(date, 'short');
  }
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDate(date, now.getFullYear() === date.getFullYear() ? 'short' : 'date');
}

/** The heading a day's entries sit under: "Today", "Yesterday", or "Monday 28 September". */
export function dayHeading(value: string | Date, now = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(date)) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return FORMATS.day.format(date);
}

const MONEY = new Map<string, Intl.NumberFormat>();

export function formatMoney(cents: number | null | undefined, currency = 'USD'): string {
  if (cents === null || cents === undefined) {
    return '';
  }
  let format = MONEY.get(currency);
  if (!format) {
    format = new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 });
    MONEY.set(currency, format);
  }
  return format.format(cents / 100);
}

export function initials(name: string | null | undefined): string {
  if (!name) {
    return '·';
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '·';
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count.toLocaleString('en-GB')} ${count === 1 ? one : many}`;
}

@Pipe({ name: 'when' })
export class WhenPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, style: DateStyle = 'short'): string {
    return formatDate(value, style);
  }
}

@Pipe({ name: 'ago' })
export class AgoPipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    return relativeTime(value);
  }
}

@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(cents: number | null | undefined, currency = 'USD'): string {
    return formatMoney(cents, currency);
  }
}

@Pipe({ name: 'initials' })
export class InitialsPipe implements PipeTransform {
  transform(name: string | null | undefined): string {
    return initials(name);
  }
}

@Pipe({ name: 'plural' })
export class PluralPipe implements PipeTransform {
  transform(count: number, one: string, many?: string): string {
    return plural(count, one, many);
  }
}
