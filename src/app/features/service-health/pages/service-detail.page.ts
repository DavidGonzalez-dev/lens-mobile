import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { type ChartSeries, LineChartComponent } from '../../../shared/line-chart.component';
import { buildServiceSeries, topOperationsByLatency, type TimeRange } from '../../../telemetry/domain';
import { TELEMETRY_REPOSITORY } from '../../../telemetry/telemetry.tokens';

const NS_PER_MS = 1_000_000;

/** RF-02: rate, errors and p50/p90/p99 of one service in a range, plus its 5 slowest operations. */
@Component({
  selector: 'app-service-detail',
  imports: [
    RouterLink,
    DecimalPipe,
    LineChartComponent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonListHeader,
    IonItem,
    IonText,
    IonSpinner,
    IonButton,
  ],
  styles: `
    section {
      padding: 8px 16px 16px;
    }
    h3 {
      margin: 8px 0;
      font-size: 15px;
    }
  `,
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/services" />
        </ion-buttons>
        <ion-title>{{ service() }}</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [value]="range()" (ionChange)="range.set($any($event.detail.value))">
          <ion-segment-button value="15m"><ion-label>15 min</ion-label></ion-segment-button>
          <ion-segment-button value="1h"><ion-label>1 h</ion-label></ion-segment-button>
          <ion-segment-button value="24h"><ion-label>24 h</ion-label></ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (points.error()) {
        <div class="ion-padding ion-text-center">
          <ion-text color="danger"><p>Could not load the metrics.</p></ion-text>
          <ion-button (click)="points.reload()">Retry</ion-button>
        </div>
      } @else if (points.isLoading()) {
        <div class="ion-padding ion-text-center"><ion-spinner /></div>
      } @else if (series().length === 0) {
        <p class="ion-padding ion-text-center">No traffic in this range.</p>
      } @else {
        <section>
          <h3>Rate</h3>
          <app-line-chart [series]="rateChart()" unit="req/min" ariaLabel="Requests per minute" />
        </section>
        <section>
          <h3>Errors</h3>
          <app-line-chart [series]="errorChart()" unit="errors/min" ariaLabel="Errors per minute" />
        </section>
        <section>
          <h3>Latency</h3>
          <app-line-chart [series]="latencyChart()" unit="ms" ariaLabel="Latency percentiles" />
        </section>

        <ion-list>
          <ion-list-header><ion-label>Slowest operations (p99)</ion-label></ion-list-header>
          @for (op of topOperations(); track op.name) {
            <ion-item>
              <ion-label>
                <h3>{{ op.name }}</h3>
                <p>{{ op.requestCount }} requests</p>
              </ion-label>
              <ion-label slot="end">{{ op.p99Ns / NS_PER_MS | number: '1.0-1' }} ms</ion-label>
            </ion-item>
          }
        </ion-list>
      }

      <div class="ion-padding">
        <ion-button expand="block" routerLink="/tabs/traces" [queryParams]="{ service: service() }">
          View traces
        </ion-button>
      </div>
    </ion-content>
  `,
})
export class ServiceDetailPage {
  /** From the route `:service` (withComponentInputBinding). */
  readonly service = input.required<string>();

  protected readonly NS_PER_MS = NS_PER_MS;
  protected readonly range = signal<TimeRange>('15m');

  private readonly telemetry = inject(TELEMETRY_REPOSITORY);

  /** Reloads by itself when the service or the range change. */
  protected readonly points = resource({
    params: () => ({ service: this.service(), range: this.range() }),
    loader: ({ params }) => this.telemetry.getRedSeries(params.service, params.range),
  });

  private readonly loadedPoints = computed(() => (this.points.hasValue() ? this.points.value() : []));
  protected readonly series = computed(() => buildServiceSeries(this.loadedPoints()));
  protected readonly topOperations = computed(() => topOperationsByLatency(this.loadedPoints()));

  protected readonly rateChart = computed<ChartSeries[]>(() => [
    { label: 'requests', color: 'var(--ion-color-primary)', values: this.series().map((m) => m.requestCount) },
  ]);
  protected readonly errorChart = computed<ChartSeries[]>(() => [
    { label: 'errors', color: 'var(--ion-color-danger)', values: this.series().map((m) => m.errorCount) },
  ]);
  protected readonly latencyChart = computed<ChartSeries[]>(() => [
    { label: 'p50', color: 'var(--ion-color-success)', values: this.series().map((m) => m.p50Ns / NS_PER_MS) },
    { label: 'p90', color: 'var(--ion-color-warning)', values: this.series().map((m) => m.p90Ns / NS_PER_MS) },
    { label: 'p99', color: 'var(--ion-color-danger)', values: this.series().map((m) => m.p99Ns / NS_PER_MS) },
  ]);
}
