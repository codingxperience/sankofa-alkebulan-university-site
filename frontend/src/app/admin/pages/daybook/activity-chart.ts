import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { DaybookKind } from '../../core/types';
import { DAYBOOK_KIND } from '../../core/vocabulary';

const KINDS: readonly DaybookKind[] = ['inquiry', 'application', 'registration', 'order'];
const WIDTH = 600;
const HEIGHT = 132;
const GAP = 4;

const DAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

interface Column {
  readonly x: number;
  readonly label: string;
  readonly total: number;
  readonly parts: ReadonlyArray<{ kind: DaybookKind; y: number; height: number }>;
}

/**
 * Thirty days of arrivals as stacked columns, one colour per kind of record.
 * Drawn as plain SVG: no charting library, nothing to load, crisp at any size.
 */
@Component({
  selector: 'sc-activity-chart',
  template: `
    <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" role="img" [attr.aria-label]="summary()" preserveAspectRatio="none">
      <line x1="0" [attr.y1]="height - 0.5" [attr.x2]="width" [attr.y2]="height - 0.5" class="axis" vector-effect="non-scaling-stroke" />
      @for (column of columns(); track column.label) {
        <g>
          <title>{{ column.label }}: {{ column.total }} {{ column.total === 1 ? 'arrival' : 'arrivals' }}</title>
          <rect [attr.x]="column.x" y="0" [attr.width]="barWidth()" [attr.height]="height" class="hit" />
          @if (column.total === 0) {
            <rect [attr.x]="column.x" [attr.y]="height - 2" [attr.width]="barWidth()" height="2" class="quiet" />
          }
          @for (part of column.parts; track part.kind) {
            <rect [attr.x]="column.x" [attr.y]="part.y" [attr.width]="barWidth()" [attr.height]="part.height" rx="1.5" [class]="'bar bar--' + part.kind" />
          }
        </g>
      }
    </svg>
    <div class="ticks" aria-hidden="true">
      <span>{{ firstLabel() }}</span>
      <span>Today</span>
    </div>
    <ul class="legend">
      @for (entry of legend(); track entry.kind) {
        <li>
          <span [class]="'swatch swatch--' + entry.kind" aria-hidden="true"></span>
          {{ entry.label }}
          <strong class="sc-num">{{ entry.total }}</strong>
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: block;
    }

    svg {
      display: block;
      width: 100%;
      height: 132px;
    }

    .axis {
      stroke: var(--sc-line);
      stroke-width: 1;
    }

    .hit {
      fill: transparent;
    }

    .quiet {
      fill: var(--sc-line);
    }

    g:hover .hit {
      fill: var(--sc-paper);
    }

    .ticks {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-family: var(--sc-mono);
      font-size: 11px;
      color: var(--sc-ink-3);
    }

    .bar--inquiry,
    .swatch--inquiry {
      fill: #0f4c81;
      background: #0f4c81;
    }

    .bar--application,
    .swatch--application {
      fill: #d4a22f;
      background: #d4a22f;
    }

    .bar--registration,
    .swatch--registration {
      fill: #2c7a72;
      background: #2c7a72;
    }

    .bar--order,
    .swatch--order {
      fill: #b35c2a;
      background: #b35c2a;
    }

    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 18px;
      margin-top: 14px;
      font-size: 12.5px;
      color: var(--sc-ink-3);
    }

    .legend li {
      display: inline-flex;
      align-items: center;
      gap: 7px;
    }

    .legend strong {
      color: var(--sc-ink);
      font-weight: 600;
    }

    .swatch {
      width: 9px;
      height: 9px;
      border-radius: 2px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityChart {
  readonly days = input.required<readonly string[]>();
  readonly series = input.required<Partial<Record<DaybookKind, number[]>>>();

  protected readonly width = WIDTH;
  protected readonly height = HEIGHT;

  private readonly kinds = computed(() => KINDS.filter((kind) => this.series()[kind]));

  protected readonly barWidth = computed(() => {
    const count = Math.max(this.days().length, 1);
    return (WIDTH - GAP * (count - 1)) / count;
  });

  protected readonly columns = computed<Column[]>(() => {
    const days = this.days();
    const series = this.series();
    const kinds = this.kinds();
    const totals = days.map((_, i) => kinds.reduce((sum, kind) => sum + (series[kind]?.[i] ?? 0), 0));
    const max = Math.max(4, ...totals);
    return days.map((day, i) => {
      let y = HEIGHT;
      const parts = kinds
        .map((kind) => {
          const value = series[kind]?.[i] ?? 0;
          const height = (value / max) * (HEIGHT - 6);
          y -= height;
          return { kind, y, height };
        })
        .filter((part) => part.height > 0);
      return { x: i * (this.barWidth() + GAP), label: DAY.format(new Date(`${day}T12:00:00`)), total: totals[i], parts };
    });
  });

  protected readonly legend = computed(() =>
    this.kinds().map((kind) => ({
      kind,
      label: DAYBOOK_KIND[kind].plural,
      total: (this.series()[kind] ?? []).reduce((sum, value) => sum + value, 0),
    })),
  );

  protected readonly firstLabel = computed(() => {
    const first = this.days()[0];
    return first ? DAY.format(new Date(`${first}T12:00:00`)) : '';
  });

  protected readonly summary = computed(() => {
    const parts = this.legend().map((entry) => `${entry.total} ${entry.label.toLowerCase()}`);
    return `Arrivals over the last ${this.days().length} days: ${parts.join(', ')}.`;
  });
}
