import { Component, input } from '@angular/core';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

/** RF-07: create a rule (no ruleId) or edit one (ruleId from the route). */
@Component({
  selector: 'app-alert-rule-edit',
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/alerts" />
        </ion-buttons>
        <ion-title>{{ ruleId() ? 'Edit rule' : 'New rule' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <!-- TODO(T11): form with service, aggregate, threshold, window; validation; create/update/delete. -->
    </ion-content>
  `,
})
export class AlertRuleEditPage {
  /** Undefined on /alerts/new. */
  readonly ruleId = input<string>();
}
