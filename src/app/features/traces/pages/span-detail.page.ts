import { Component, input } from '@angular/core';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

/** RF-05: attributes, events, status and error message of one span. */
@Component({
  selector: 'app-span-detail',
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="'/tabs/traces/' + traceId()" />
        </ion-buttons>
        <ion-title>Span {{ spanId() }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <!-- TODO(T10): find spanId among getSpansFromTrace(traceId); show it as plain text (RNF-08). -->
    </ion-content>
  `,
})
export class SpanDetailPage {
  readonly traceId = input.required<string>();
  readonly spanId = input.required<string>();
}
