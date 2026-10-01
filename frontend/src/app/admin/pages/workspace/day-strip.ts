import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { DaybookEntry } from '../../core/types';
import { Face } from '../../ui/ui';
import { daybookAction, daybookLink } from './daybook-links';

const TIME = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
/** How many faces a single hour shows before the rest become "+n". */
const FACES_PER_HOUR = 2;

interface Person {
  readonly key: string;
  readonly name: string | null;
  readonly link: string;
  readonly label: string;
}

interface Slot {
  readonly key: number;
  readonly pct: number;
  readonly people: readonly Person[];
  readonly extra: number;
}

export interface DayEvent {
  readonly id: string;
  readonly title: string;
  readonly startsAt: string;
}

function hoursOf(date: Date): number {
  return date.getHours() + date.getMinutes() / 60;
}

/**
 * Today as a single line, from early morning to evening: the part already
 * lived through filled in gold, a marker at the present minute, everyone who
 * wrote in, applied, registered or ordered placed at the hour they did, and
 * today's events waiting further along.
 */
@Component({
  selector: 'sc-day-strip',
  imports: [RouterLink, Face],
  templateUrl: './day-strip.html',
  styleUrl: './day-strip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayStrip {
  readonly entries = input.required<readonly DaybookEntry[]>();
  readonly events = input<readonly DayEvent[]>([]);
  /** Asks the page to bring its full daybook into view. */
  readonly open = output<void>();

  private readonly now = signal(new Date());

  protected readonly date = computed(() => DATE.format(this.now()));
  protected readonly nowLabel = computed(() => TIME.format(this.now()));

  /** The hours the line spans: at least 08:00 to 18:00, stretched to fit anything earlier or later. */
  private readonly span = computed(() => {
    const times = [...this.entries().map((entry) => hoursOf(new Date(entry.at))), ...this.events().map((event) => hoursOf(new Date(event.startsAt)))];
    const now = hoursOf(this.now());
    const start = Math.max(0, Math.floor(Math.min(8, now - 1, ...times)));
    const end = Math.min(24, Math.ceil(Math.max(18, now + 2, ...times.map((time) => time + 0.5))));
    return { start, end };
  });

  protected readonly nowPct = computed(() => this.position(hoursOf(this.now())));

  protected readonly slots = computed<Slot[]>(() => {
    const byHour = new Map<number, DaybookEntry[]>();
    for (const entry of this.entries()) {
      const hour = new Date(entry.at).getHours();
      byHour.set(hour, [...(byHour.get(hour) ?? []), entry]);
    }
    return [...byHour.entries()]
      .sort(([a], [b]) => a - b)
      .map(([hour, entries]) => ({
        key: hour,
        pct: this.position(hour + 0.5),
        people: entries.slice(0, FACES_PER_HOUR).map((entry) => ({
          key: entry.kind + entry.id,
          name: entry.who,
          link: daybookLink(entry),
          label: `${daybookAction(entry)} at ${TIME.format(new Date(entry.at))}`,
        })),
        extra: Math.max(0, entries.length - FACES_PER_HOUR),
      }));
  });

  protected readonly marks = computed(() =>
    this.events().map((event) => {
      const at = new Date(event.startsAt);
      return { id: event.id, title: event.title, time: TIME.format(at), pct: this.position(hoursOf(at)) };
    }),
  );

  /** Hour labels every three hours, left out wherever a face or a marker already sits. */
  protected readonly ticks = computed(() => {
    const { start, end } = this.span();
    const taken = [this.nowPct(), ...this.slots().map((slot) => slot.pct), ...this.marks().map((mark) => mark.pct)];
    const ticks: Array<{ label: string; pct: number }> = [];
    for (let hour = Math.ceil((start + 1) / 3) * 3; hour < end; hour += 3) {
      const pct = this.position(hour);
      if (taken.every((other) => Math.abs(other - pct) > 7)) {
        ticks.push({ label: `${String(hour).padStart(2, '0')}:00`, pct });
      }
    }
    return ticks;
  });

  constructor() {
    const timer = setInterval(() => this.now.set(new Date()), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  private position(hours: number): number {
    const { start, end } = this.span();
    return Math.min(100, Math.max(0, ((hours - start) / (end - start)) * 100));
  }
}
