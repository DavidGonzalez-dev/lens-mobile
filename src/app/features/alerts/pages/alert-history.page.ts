import { Component } from '@angular/core';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

/** RF-09: rule transitions, newest first. FIRING → OK is shown as "resolved". */
@Component({
  selector: 'app-alert-history',
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/alerts" />
        </ion-buttons>
        <ion-title>History</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <!-- TODO(T11): getAlertHistory() with date and measured value. -->
    </ion-content>
  `,
})
export class AlertHistoryPage {}
