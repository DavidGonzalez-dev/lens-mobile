import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonNote,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { SpanStatusCode, criticalPath } from '../../../telemetry/domain';
import { TELEMETRY_REPOSITORY } from '../../../telemetry/telemetry.tokens';
import { serviceColor } from '../service-color';
import { buildWaterfall } from '../waterfall';

const NS_PER_MS = 1_000_000;
/** Indentation per tree level, in pixels. */
const INDENT_PX = 12;
/** Bars shorter than this are still drawn, so a 0.1 ms span stays tappable and visible. */
const MIN_BAR_PCT = 0.5;

/** RF-04: spans nested by parent, colored by service, critical path highlighted. */
@Component({
  selector: 'app-trace-waterfall',
  imports: [
    RouterLink,
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonButton,
    IonSpinner,
    IonText,
    IonNote,
  ],
  styles: `
    .summary {
      display: block;
      padding: 8px 16px;
    }
    .row {
      display: grid;
      grid-template-columns: 45% 1fr;
      align-items: center;
      gap: 8px;
      min-height: 44px;
      padding: 0 16px;
      border-bottom: 1px solid var(--ion-color-step-100, #2a2a2a);
      color: inherit;
      text-decoration: none;
    }
    .row.critical .name {
      font-weight: 700;
    }
    .name {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-size: 14px;
    }
    .name small {
      display: block;
      opacity: 0.7;
    }
    .track {
      position: relative;
      height: 14px;
    }
    .bar {
      position: absolute;
      top: 0;
      height: 100%;
      border-radius: 3px;
      opacity: 0.45;
    }
    .row.critical .bar {
      opacity: 1;
    }
    .row.error .bar {
      outline: 2px solid var(--ion-color-danger);
    }
  `,
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/traces" />
        </ion-buttons>
        <ion-title>Trace</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="compare">Compare</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (spans.error()) {
        <div class="ion-padding ion-text-center">
          <ion-text color="danger"><p>Could not load the trace.</p></ion-text>
          <ion-button (click)="spans.reload()">Retry</ion-button>
        </div>
      } @else if (spans.isLoading()) {
        <div class="ion-padding ion-text-center"><ion-spinner /></div>
      } @else if (rows().length === 0) {
        <p class="ion-padding ion-text-center">This trace has no spans.</p>
      } @else {
        <ion-note class="summary">
          {{ rows()[0].span.name }} · {{ rows()[0].span.durationNs / NS_PER_MS | number: '1.0-1' }} ms ·
          {{ rows().length }} spans · bold = critical path
        </ion-note>

        @for (row of rows(); track row.span.spanId) {
          <a
            class="row"
            [routerLink]="['spans', row.span.spanId]"
            [class.critical]="critical().has(row.span.spanId)"
            [class.error]="row.span.statusCode === SpanStatusCode.ERROR"
          >
            <span class="name" [style.padding-left.px]="row.depth * INDENT_PX">
              {{ row.span.name }}
              <small>{{ row.span.service }} · {{ row.span.durationNs / NS_PER_MS | number: '1.0-1' }} ms</small>
            </span>
            <span class="track">
              <span
                class="bar"
                [style.left.%]="row.offsetPct"
                [style.width.%]="row.widthPct < MIN_BAR_PCT ? MIN_BAR_PCT : row.widthPct"
                [style.background]="serviceColor(row.span.service)"
              ></span>
            </span>
          </a>
        }
      }
    </ion-content>
  `,
})
export class TraceWaterfallPage {
  readonly traceId = input.required<string>();

  protected readonly NS_PER_MS = NS_PER_MS;
  protected readonly INDENT_PX = INDENT_PX;
  protected readonly MIN_BAR_PCT = MIN_BAR_PCT;
  protected readonly SpanStatusCode = SpanStatusCode;
  protected readonly serviceColor = serviceColor;

  private readonly telemetry = inject(TELEMETRY_REPOSITORY);

  protected readonly spans = resource({
    params: () => this.traceId(),
    loader: ({ params: traceId }) => this.telemetry.getSpansFromTrace(traceId),
  });

  private readonly loadedSpans = computed(() => (this.spans.hasValue() ? this.spans.value() : []));
  protected readonly rows = computed(() => buildWaterfall(this.loadedSpans()));
  /** A Set answers "is this span critical?" without walking a list for every row. */
  protected readonly critical = computed(() => new Set(criticalPath(this.loadedSpans())));
}
