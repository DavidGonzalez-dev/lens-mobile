import { DecimalPipe, PercentPipe } from '@angular/common';
import { Component, computed, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { sortServices, type ServiceSort, type TimeRange } from '../../../telemetry/domain';
import { TELEMETRY_DATA_VERSION, TELEMETRY_REPOSITORY } from '../../../telemetry/telemetry.tokens';

const NS_PER_MS = 1_000_000;

/** RF-01: every service with its RED summary, in a range, sorted by errors or latency. */
@Component({
  selector: 'app-service-list',
  imports: [
    RouterLink,
    DecimalPipe,
    PercentPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonList,
    IonItem,
    IonLabel,
    IonText,
    IonSpinner,
    IonButton,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Services</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [value]="range()" (ionChange)="range.set($any($event.detail.value))">
          <ion-segment-button value="15m"><ion-label>15 min</ion-label></ion-segment-button>
          <ion-segment-button value="1h"><ion-label>1 h</ion-label></ion-segment-button>
          <ion-segment-button value="24h"><ion-label>24 h</ion-label></ion-segment-button>
        </ion-segment>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [value]="sortBy()" (ionChange)="sortBy.set($any($event.detail.value))">
          <ion-segment-button value="errors"><ion-label>Errors</ion-label></ion-segment-button>
          <ion-segment-button value="latency"><ion-label>Latency</ion-label></ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (services.error()) {
        <div class="ion-padding ion-text-center">
          <ion-text color="danger"><p>Could not load the services.</p></ion-text>
          <ion-button (click)="services.reload()">Retry</ion-button>
        </div>
      } @else if (services.isLoading()) {
        <div class="ion-padding ion-text-center"><ion-spinner /></div>
      } @else if (sorted().length === 0) {
        <p class="ion-padding ion-text-center">No traffic in this range.</p>
      } @else {
        <ion-list>
          @for (service of sorted(); track service.service) {
            <ion-item [routerLink]="service.service" detail>
              <ion-label>
                <h2>{{ service.service }}</h2>
                <p>
                  {{ service.rps | number: '1.2-2' }} req/s ·
                  <ion-text [color]="service.errorRate > 0 ? 'danger' : undefined">
                    {{ service.errorRate | percent: '1.1-1' }} errors
                  </ion-text>
                  · p99 {{ service.p99Ns / NS_PER_MS | number: '1.0-0' }} ms
                </p>
              </ion-label>
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
})
export class ServiceListPage {
  protected readonly NS_PER_MS = NS_PER_MS;
  protected readonly range = signal<TimeRange>('15m');
  protected readonly sortBy = signal<ServiceSort>('errors');

  private readonly telemetry = inject(TELEMETRY_REPOSITORY);
  /** Read in the resource params so another demo scenario reloads the screen. */
  private readonly dataVersion = inject(TELEMETRY_DATA_VERSION);

  /** Reloads by itself every time `range` changes. */
  protected readonly services = resource({
    params: () => ({ range: this.range(), version: this.dataVersion() }),
    loader: ({ params }) => this.telemetry.getServiceRed(params.range),
  });

  /** Re-sorts by itself when the data or `sortBy` change, without asking the repository again. */
  protected readonly sorted = computed(() =>
    sortServices(this.services.hasValue() ? this.services.value() : [], this.sortBy()),
  );
}
