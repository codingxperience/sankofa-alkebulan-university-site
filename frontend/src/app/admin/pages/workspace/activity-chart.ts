import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import type { DaybookKind } from '../../core/types';
import { DAYBOOK_KIND } from '../../core/vocabulary';

/** Stacking order, bottom to top. The colours below were checked as a set against the dark card. */
const KINDS: readonly DaybookKind[] = ['inquiry', 'application', 'registration', 'order'];
const WIDTH = 600;
const HEIGHT = 140;
const GAP = 4;

const DAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

interface Column {
  readonly x: number;
  readonly centre: number;
  /** Where the tooltip sits: centred on the column, kept clear of the card's edges. */
  readonly tip: number;
  readonly label: string;
  readonly total: number;
  readonly parts: ReadonlyArray<{ kind: DaybookKind; y: number; height: number; value: number }>;
}

/**
 * Thirty days of arrivals as stacked columns, one colour per kind of record.
 * Drawn as plain SVG: no charting library, nothing to load, crisp at any size.
 * Pointing at a day shows what arrived on it.
 */
@Component({
  selector: 'sc-activity-chart',
  template: `
    <div class="plot" (mouseleave)="hovered.set(null)">
      <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" role="img" [attr.aria-label]="summary()" preserveAspectRatio="none">
        @for (line of grid; track line) {
          <line x1="0" [attr.y1]="line" [attr.x2]="width" [attr.y2]="line" class="grid" vector-effect="non-scaling-stroke" />
        }
        <line x1="0" [attr.y1]="height - 0.5" [attr.x2]="width" [attr.y2]="height - 0.5" class="axis" vector-effect="non-scaling-stroke" />
        @for (column of columns(); track column.label; let i = $index) {
          <g (mouseenter)="hovered.set(i)" [class.is-hovered]="hovered() === i">
            <title>{{ column.label }}: {{ column.total }} {{ column.total === 1 ? 'arrival' : 'arrivals' }}</title>
            <rect [attr.x]="column.x - gap / 2" y="0" [attr.width]="barWidth() + gap" [attr.height]="height" class="hit" />
            @if (column.total === 0) {
              <rect [attr.x]="column.x" [attr.y]="height - 2" [attr.width]="barWidth()" height="2" class="quiet" />
            }
            @for (part of column.parts; track part.kind) {
              <rect
                [attr.x]="column.x"
                [attr.y]="part.y"
                [attr.width]="barWidth()"
                [attr.height]="part.height"
                rx="2"
                [class]="'bar bar--' + part.kind"
                vector-effect="non-scaling-stroke"
              />
            }
          </g>
        }
      </svg>
      @if (hoveredColumn(); as column) {
        <div class="tip" [style.left.%]="column.tip" aria-hidden="true">
          <strong>{{ column.label }}</strong>
          @if (column.total) {
            <ul>
              @for (part of column.parts; track part.kind) {
                <li>
                  <span [class]="'swatch swatch--' + part.kind"></span>
                  {{ names[part.kind].plural }}
                  <b class="sc-num">{{ part.value }}</b>
                </li>
              }
            </ul>
          } @else {
            <span class="tip__none">Nothing arrived</span>
          }
        </div>
      }
    </div>
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

    .plot {
      position: relative;
    }

    svg {
      display: block;
      width: 100%;
      height: 140px;
    }

    .grid {
      stroke: rgba(255, 255, 255, 0.05);
      stroke-width: 1;
    }

    .axis {
      stroke: rgba(255, 255, 255, 0.14);
      stroke-width: 1;
    }

    .hit {
      fill: transparent;
    }

    .quiet {
      fill: rgba(255, 255, 255, 0.12);
    }

    g.is-hovered .hit {
      fill: rgba(255, 255, 255, 0.05);
    }

    /* A thin seam of the card's own colour between stacked segments. */
    .bar {
      stroke: var(--sc-card);
      stroke-width: 2px;
      paint-order: stroke;
    }

    .bar--inquiry,
    .swatch--inquiry {
      fill: #3987e5;
      background: #3987e5;
    }

    .bar--application,
    .swatch--application {
      fill: #bf8a2a;
      background: #bf8a2a;
    }

    .bar--registration,
    .swatch--registration {
      fill: #2a9d8f;
      background: #2a9d8f;
    }

    .bar--order,
    .swatch--order {
      fill: #d95926;
      background: #d95926;
    }

    .tip {
      position: absolute;
      bottom: calc(100% + 8px);
      z-index: 5;
      min-width: 168px;
      padding: 10px 12px;
      border-radius: 14px;
      background: #f5f2ea;
      color: #0b1f33;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
      font-size: 12px;
      pointer-events: none;
      transform: translateX(-50%);
    }

    .tip strong {
      display: block;
      margin-bottom: 6px;
      font-weight: 600;
    }

    .tip ul {
      display: grid;
      gap: 4px;
    }

    .tip li {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .tip b {
      margin-left: auto;
      font-weight: 600;
    }

    .tip__none {
      color: #4a5d70;
    }

    .ticks {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-family: var(--sc-mono);
      font-size: 11px;
      color: var(--sc-ink-3);
    }

    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 20px;
      margin-top: 16px;
      font-size: 12.5px;
      color: var(--sc-ink-3);
    }

    .legend li {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .legend strong {
      color: var(--sc-ink);
      font-weight: 600;
    }

    .swatch {
      width: 9px;
      height: 9px;
      flex-shrink: 0;
      border-radius: 50%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityChart {
  readonly days = input.required<readonly string[]>();
  readonly series = input.required<Partial<Record<DaybookKind, number[]>>>();

  protected readonly width = WIDTH;
  protected readonly height = HEIGHT;
  protected readonly gap = GAP;
  protected readonly grid = [HEIGHT * 0.25, HEIGHT * 0.5, HEIGHT * 0.75];
  protected readonly names = DAYBOOK_KIND;
  protected readonly hovered = signal<number | null>(null);

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
    const width = this.barWidth();
    return days.map((day, i) => {
      let y = HEIGHT;
      const parts = kinds
        .map((kind) => {
          const value = series[kind]?.[i] ?? 0;
          const height = (value / max) * (HEIGHT - 8);
          y -= height;
          return { kind, y, height, value };
        })
        .filter((part) => part.height > 0);
      const x = i * (width + GAP);
      const centre = ((x + width / 2) / WIDTH) * 100;
      return { x, centre, tip: Math.min(84, Math.max(16, centre)), label: DAY.format(new Date(`${day}T12:00:00`)), total: totals[i], parts };
    });
  });

  protected readonly hoveredColumn = computed(() => {
    const index = this.hovered();
    return index === null ? null : (this.columns()[index] ?? null);
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
