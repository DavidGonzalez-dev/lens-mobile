import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar } from '@ionic/angular';

/** RF-03: search traces with filters, 50 per page. */
@Component({
  selector: 'app-trace-search',
  imports: [RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Traces</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <!-- TODO(T8): filters + getTraces(query, { offset, limit: 50 }) with infinite scroll. -->
      @if (service()) {
        <p class="ion-padding-horizontal">Filtered by service: {{ service() }}</p>
      }
      <ion-list>
        <ion-item routerLink="demo-trace" detail>
          <ion-label>demo-trace</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
})
export class TraceSearchPage {
  /** From the query param `?service=` set by the service detail. */
  readonly service = input<string>();
}
