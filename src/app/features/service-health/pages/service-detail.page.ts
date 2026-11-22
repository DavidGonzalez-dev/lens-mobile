import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

/** RF-02: RED charts of one service. */
@Component({
  selector: 'app-service-detail',
  imports: [RouterLink, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonButton],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/services" />
        </ion-buttons>
        <ion-title>{{ service() }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <!-- TODO(T7): rate, errors and p50/p90/p99 charts from getRedSeries(service, range). -->
      <ion-button expand="block" routerLink="/tabs/traces" [queryParams]="{ service: service() }">
        View traces
      </ion-button>
    </ion-content>
  `,
})
export class ServiceDetailPage {
  /** From the route `:service` (withComponentInputBinding). */
  readonly service = input.required<string>();
}
