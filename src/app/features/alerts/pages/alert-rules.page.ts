import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
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

/** RF-07: alert rules with their current status. */
@Component({
  selector: 'app-alert-rules',
  imports: [RouterLink, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Alerts</ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="history">History</ion-button>
          <ion-button routerLink="new">New</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <!-- TODO(T11): getAlertRules(), each one evaluated with evaluateRule. -->
      <ion-list>
        <ion-item routerLink="default-checkout-errors/edit" detail>
          <ion-label>Checkout error rate</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
})
export class AlertRulesPage {}
