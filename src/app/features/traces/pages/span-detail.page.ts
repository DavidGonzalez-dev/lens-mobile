import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, resource } from '@angular/core';
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { ExpandableTextComponent } from '../../../shared/expandable-text.component';
import { SpanStatusCode } from '../../../telemetry/domain';
import { TELEMETRY_REPOSITORY } from '../../../telemetry/telemetry.tokens';
import { toAttributeRows } from '../attribute-rows';

const NS_PER_MS = 1_000_000;

/** RF-05: attributes, events, status and error message of one span. Texts shown as plain text (RNF-08). */
@Component({
  selector: 'app-span-detail',
  imports: [
    DatePipe,
    DecimalPipe,
    ExpandableTextComponent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonBadge,
    IonText,
    IonButton,
    IonSpinner,
  ],
  styles: `
    .key {
      flex: 0 0 40%;
      opacity: 0.7;
      word-break: break-all;
    }
    .value {
      flex: 1;
      text-align: end;
    }
  `,
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="'/tabs/traces/' + traceId()" />
        </ion-buttons>
        <ion-title>{{ span()?.name ?? 'Span' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (spans.error()) {
        <div class="ion-padding ion-text-center">
          <ion-text color="danger"><p>Could not load the span.</p></ion-text>
          <ion-button (click)="spans.reload()">Retry</ion-button>
        </div>
      } @else if (spans.isLoading()) {
        <div class="ion-padding ion-text-center"><ion-spinner /></div>
      } @else if (span(); as span) {
        <ion-list>
          <ion-list-header><ion-label>Overview</ion-label></ion-list-header>
          <ion-item>
            <ion-label class="key">Service</ion-label>
            <ion-label class="value">{{ span.service }}</ion-label>
          </ion-item>
          <ion-item>
            <ion-label class="key">Kind</ion-label>
            <ion-label class="value">{{ span.kind }}</ion-label>
          </ion-item>
          <ion-item>
            <ion-label class="key">Start</ion-label>
            <ion-label class="value">{{ span.startMs | date: 'HH:mm:ss.SSS' }}</ion-label>
          </ion-item>
          <ion-item>
            <ion-label class="key">Duration</ion-label>
            <ion-label class="value">{{ span.durationNs / NS_PER_MS | number: '1.0-2' }} ms</ion-label>
          </ion-item>
          <ion-item>
            <ion-label class="key">Status</ion-label>
            <ion-badge slot="end" [color]="span.statusCode === SpanStatusCode.ERROR ? 'danger' : 'success'">
              {{ span.statusCode }}
            </ion-badge>
          </ion-item>
          @if (span.statusMessage) {
            <ion-item>
              <ion-label class="key">Message</ion-label>
              <ion-label class="value" color="danger">
                <app-expandable-text [text]="span.statusMessage" />
              </ion-label>
            </ion-item>
          }
        </ion-list>

        <ion-list>
          <ion-list-header><ion-label>Attributes</ion-label></ion-list-header>
          @for (row of attributes(); track row.key) {
            <ion-item>
              <ion-label class="key">{{ row.key }}</ion-label>
              <ion-label class="value"><app-expandable-text [text]="row.value" /></ion-label>
            </ion-item>
          } @empty {
            <ion-item><ion-label>No attributes.</ion-label></ion-item>
          }
        </ion-list>

        <ion-list>
          <ion-list-header><ion-label>Events</ion-label></ion-list-header>
          @for (event of span.events; track $index) {
            <ion-item>
              <ion-label>
                <h3>{{ event.name }} · +{{ event.timestampMs - span.startMs | number: '1.0-2' }} ms</h3>
                @for (row of toAttributeRows(event.attributes); track row.key) {
                  <p>{{ row.key }}: <app-expandable-text [text]="row.value" /></p>
                }
              </ion-label>
            </ion-item>
          } @empty {
            <ion-item><ion-label>No events.</ion-label></ion-item>
          }
        </ion-list>
      } @else {
        <p class="ion-padding ion-text-center">This span does not exist in the trace.</p>
      }
    </ion-content>
  `,
})
export class SpanDetailPage {
  readonly traceId = input.required<string>();
  readonly spanId = input.required<string>();

  protected readonly NS_PER_MS = NS_PER_MS;
  protected readonly SpanStatusCode = SpanStatusCode;
  protected readonly toAttributeRows = toAttributeRows;

  private readonly telemetry = inject(TELEMETRY_REPOSITORY);

  /** The repository has no "get one span": load the trace (already cached in memory) and pick it. */
  protected readonly spans = resource({
    params: () => this.traceId(),
    loader: ({ params: traceId }) => this.telemetry.getSpansFromTrace(traceId),
  });

  protected readonly span = computed(() =>
    this.spans.hasValue() ? this.spans.value().find((span) => span.spanId === this.spanId()) : undefined,
  );
  protected readonly attributes = computed(() => toAttributeRows(this.span()?.attributes ?? {}));
}
