import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar } from '@ionic/angular';

/** RF-01: every service with its RED summary. */
@Component({
  selector: 'app-service-list',
  imports: [RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Services</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <!-- TODO(T6): list getServiceRed(range) with a 15m / 1h / 24h selector. -->
      <ion-list>
        <ion-item routerLink="checkout" detail>
          <ion-label>checkout</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
})
export class ServiceListPage {}
