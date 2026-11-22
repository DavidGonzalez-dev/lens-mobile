import { Component, input } from '@angular/core';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

/** RF-06 (delivery 3): a slow trace next to a fast one of the same operation. */
@Component({
  selector: 'app-trace-compare',
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="'/tabs/traces/' + traceId()" />
        </ion-buttons>
        <ion-title>Compare</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>Available in delivery 3.</p>
    </ion-content>
  `,
})
export class TraceComparePage {
  readonly traceId = input.required<string>();
}
