import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, resource, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonContent,
  IonHeader,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  type InfiniteScrollCustomEvent,
} from '@ionic/angular';

import type { Trace, TraceQuery } from '../../../telemetry/domain';
import { TELEMETRY_DATA_VERSION, TELEMETRY_REPOSITORY } from '../../../telemetry/telemetry.tokens';
import { DEFAULT_TRACE_FILTERS, toTraceQuery, type TraceFilters } from '../trace-filters';

/** RF-03 asks for pages of 50. */
const PAGE_SIZE = 50;
const NS_PER_MS = 1_000_000;

/** RF-03: search traces by service, status, minimum duration, operation and range. */
@Component({
  selector: 'app-trace-search',
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonSegment,
    IonSegmentButton,
    IonBadge,
    IonNote,
    IonText,
    IonButton,
    IonSpinner,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Traces</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-item>
          <ion-select
            label="Service"
            interface="popover"
            [value]="filters().service"
            (ionChange)="setFilter('service', $event.detail.value)"
          >
            <ion-select-option value="">Any</ion-select-option>
            @for (service of serviceNames(); track service) {
              <ion-select-option [value]="service">{{ service }}</ion-select-option>
            }
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-input
            label="Operation"
            placeholder="e.g. charge card"
            [value]="filters().operation"
            (ionChange)="setFilter('operation', $event.detail.value ?? '')"
          />
        </ion-item>
        <ion-item>
          <ion-input
            label="Min duration (ms)"
            type="number"
            inputmode="numeric"
            min="0"
            [value]="filters().minDurationMs"
            (ionChange)="setFilter('minDurationMs', toNumberOrNull($event.detail.value))"
          />
        </ion-item>
      </ion-list>

      <ion-segment [value]="filters().status" (ionChange)="setFilter('status', $any($event.detail.value))">
        <ion-segment-button value="all"><ion-label>All</ion-label></ion-segment-button>
        <ion-segment-button value="error"><ion-label>Errors</ion-label></ion-segment-button>
        <ion-segment-button value="ok"><ion-label>OK</ion-label></ion-segment-button>
      </ion-segment>
      <ion-segment [value]="filters().range" (ionChange)="setFilter('range', $any($event.detail.value))">
        <ion-segment-button value="15m"><ion-label>15 min</ion-label></ion-segment-button>
        <ion-segment-button value="1h"><ion-label>1 h</ion-label></ion-segment-button>
        <ion-segment-button value="24h"><ion-label>24 h</ion-label></ion-segment-button>
        <ion-segment-button value="all"><ion-label>All</ion-label></ion-segment-button>
      </ion-segment>

      @if (error()) {
        <div class="ion-padding ion-text-center">
          <ion-text color="danger"><p>Could not load the traces.</p></ion-text>
          <ion-button (click)="loadFirstPage(query())">Retry</ion-button>
        </div>
      } @else if (loading()) {
        <div class="ion-padding ion-text-center"><ion-spinner /></div>
      } @else if (traces().length === 0) {
        <p class="ion-padding ion-text-center">No traces match these filters.</p>
      } @else {
        <ion-list>
          @for (trace of traces(); track trace.traceId) {
            <ion-item [routerLink]="trace.traceId" detail>
              <ion-label>
                <h2>{{ trace.rootService }} · {{ trace.rootName }}</h2>
                <p>
                  {{ trace.startMs | date: 'HH:mm:ss' }} · {{ trace.durationNs / NS_PER_MS | number: '1.0-0' }} ms ·
                  {{ trace.spanCount }} spans
                </p>
              </ion-label>
              @if (trace.hasError) {
                <ion-badge slot="end" color="danger">error</ion-badge>
              }
            </ion-item>
          }
        </ion-list>
        <ion-note class="ion-padding">{{ traces().length }} traces{{ hasMore() ? ' (scroll for more)' : '' }}</ion-note>
      }

      <ion-infinite-scroll [disabled]="!hasMore() || loading()" (ionInfinite)="loadNextPage($event)">
        <ion-infinite-scroll-content />
      </ion-infinite-scroll>
    </ion-content>
  `,
})
export class TraceSearchPage {
  /** From the query param `?service=` set by the service detail. */
  readonly service = input<string>();

  protected readonly NS_PER_MS = NS_PER_MS;
  protected readonly filters = signal<TraceFilters>(DEFAULT_TRACE_FILTERS);
  protected readonly query = computed(() => toTraceQuery(this.filters()));

  protected readonly traces = signal<Trace[]>([]);
  protected readonly hasMore = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal(false);

  private readonly telemetry = inject(TELEMETRY_REPOSITORY);
  /** Read in the resource params so another demo scenario reloads the screen. */
  private readonly dataVersion = inject(TELEMETRY_DATA_VERSION);
  /** Each search gets a number; an answer that arrives after a newer search started is ignored. */
  private searchId = 0;

  /** Options for the service select. */
  protected readonly services = resource({
    params: () => this.dataVersion(),
    loader: () => this.telemetry.getServiceRed('24h'),
  });
  protected readonly serviceNames = computed(() =>
    this.services.hasValue() ? this.services.value().map((service) => service.service) : [],
  );

  constructor() {
    // Coming from a service detail: preselect that service.
    effect(() => {
      const service = this.service();
      if (service !== undefined) {
        untracked(() => this.setFilter('service', service));
      }
    });

    // Every time the filters change, start again from the first page.
    effect(() => {
      const query = this.query();
      this.dataVersion(); // another scenario loaded → search again
      untracked(() => void this.loadFirstPage(query));
    });
  }

  protected setFilter<K extends keyof TraceFilters>(key: K, value: TraceFilters[K]): void {
    this.filters.update((filters) => ({ ...filters, [key]: value }));
  }

  protected toNumberOrNull(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  protected async loadFirstPage(query: TraceQuery): Promise<void> {
    const id = ++this.searchId;
    this.loading.set(true);
    this.error.set(false);
    try {
      const page = await this.telemetry.getTraces(query, { offset: 0, limit: PAGE_SIZE });
      if (id !== this.searchId) return;
      this.traces.set(page.data);
      this.hasMore.set(page.hasMore);
    } catch {
      if (id === this.searchId) this.error.set(true);
    } finally {
      if (id === this.searchId) this.loading.set(false);
    }
  }

  protected async loadNextPage(event: InfiniteScrollCustomEvent): Promise<void> {
    const id = this.searchId;
    try {
      const page = await this.telemetry.getTraces(this.query(), {
        offset: this.traces().length,
        limit: PAGE_SIZE,
      });
      if (id !== this.searchId) return;
      this.traces.update((traces) => [...traces, ...page.data]);
      this.hasMore.set(page.hasMore);
    } finally {
      await event.target.complete();
    }
  }
}
