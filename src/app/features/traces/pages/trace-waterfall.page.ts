import { Component, input } from '@angular/core';
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
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

/** RF-04: spans nested by parent, critical path highlighted. */
@Component({
  selector: 'app-trace-waterfall',
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/traces" />
        </ion-buttons>
        <ion-title>Trace {{ traceId() }}</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="compare">Compare</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <!-- TODO(T9): getSpansFromTrace(traceId) drawn as a waterfall, criticalPath highlighted. -->
      <ion-list>
        <ion-item routerLink="spans/demo-span" detail>
          <ion-label>demo-span</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
})
export class TraceWaterfallPage {
  readonly traceId = input.required<string>();
}
