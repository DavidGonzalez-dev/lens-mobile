import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** One line of the chart. Every series of a chart must have the same number of values. */
export interface ChartSeries {
  label: string;
  color: string;
  values: number[];
}

/** Drawing area in SVG units; the SVG stretches it to the width of the screen. */
const WIDTH = 100;
const HEIGHT = 40;

/**
 * Minimal line chart in plain SVG: no chart library, so it works offline and weighs nothing.
 * X is the position in the array (one value per minute), Y goes from 0 to the biggest value.
 */
@Component({
  selector: 'app-line-chart',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }
    .frame {
      position: relative;
    }
    svg {
      display: block;
      width: 100%;
      height: 120px;
      border-bottom: 1px solid var(--ion-color-step-200, #444);
    }
    polyline {
      fill: none;
      stroke-width: 2;
      vector-effect: non-scaling-stroke;
    }
    .max {
      position: absolute;
      top: 0;
      left: 4px;
      font-size: 11px;
      opacity: 0.7;
    }
    .legend {
      display: flex;
      gap: 12px;
      font-size: 12px;
      margin-top: 4px;
    }
    .dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 4px;
    }
  `,
  template: `
    <div class="frame">
      <svg
        [attr.viewBox]="'0 0 ' + WIDTH + ' ' + HEIGHT"
        preserveAspectRatio="none"
        role="img"
        [attr.aria-label]="ariaLabel()"
      >
        @for (line of lines(); track line.label) {
          <polyline [attr.points]="line.points" [attr.stroke]="line.color" />
        }
      </svg>
      <span class="max">{{ max() | number: '1.0-2' }} {{ unit() }}</span>
    </div>
    @if (series().length > 1) {
      <div class="legend">
        @for (line of series(); track line.label) {
          <span><span class="dot" [style.background]="line.color"></span>{{ line.label }}</span>
        }
      </div>
    }
  `,
})
export class LineChartComponent {
  readonly series = input.required<ChartSeries[]>();
  /** Shown next to the top value, e.g. "ms" or "req/min". */
  readonly unit = input('');
  readonly ariaLabel = input('Chart');

  protected readonly WIDTH = WIDTH;
  protected readonly HEIGHT = HEIGHT;

  /** Biggest value of every series; never 0 so a flat line at 0 does not divide by zero. */
  protected readonly max = computed(() => Math.max(1, ...this.series().flatMap((line) => line.values)));

  protected readonly lines = computed(() => {
    const max = this.max();
    return this.series().map((line) => {
      const last = Math.max(1, line.values.length - 1);
      const points = line.values
        .map((value, i) => `${(i / last) * WIDTH},${HEIGHT - (value / max) * HEIGHT}`)
        .join(' ');
      return { label: line.label, color: line.color, points };
    });
  });
}
