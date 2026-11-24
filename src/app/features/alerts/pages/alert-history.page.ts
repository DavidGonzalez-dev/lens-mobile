import { DatePipe } from '@angular/common';
import { Component, inject, resource } from '@angular/core';
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
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { AlertStatus } from '../../../telemetry/domain';
import { ALERT_REPOSITORY } from '../../../telemetry/telemetry.tokens';
import { formatAlertValue } from '../alert-rule-form';

/** RF-09: rule transitions, newest first. FIRING → OK is shown as "resolved". */
@Component({
  selector: 'app-alert-history',
  imports: [
    DatePipe,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonText,
    IonButton,
    IonSpinner,
  ],
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
      @if (history.error()) {
        <div class="ion-padding ion-text-center">
          <ion-text color="danger"><p>Could not load the history.</p></ion-text>
          <ion-button (click)="history.reload()">Retry</ion-button>
        </div>
      } @else if (!history.hasValue()) {
        <div class="ion-padding ion-text-center"><ion-spinner /></div>
      } @else if (history.value().length === 0) {
        <p class="ion-padding ion-text-center">No alert has fired yet.</p>
      } @else {
        <ion-list>
          @for (entry of history.value(); track entry.transition.id) {
            <ion-item>
              <ion-label>
                <h2>{{ entry.ruleName }}</h2>
                <p>{{ entry.transition.tsMs | date: 'dd/MM HH:mm:ss' }} · measured {{ entry.value }}</p>
              </ion-label>
              @if (entry.transition.toStatus === AlertStatus.FIRING) {
                <ion-badge slot="end" color="danger">FIRED</ion-badge>
              } @else {
                <ion-badge slot="end" color="success">RESOLVED</ion-badge>
              }
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
})
export class AlertHistoryPage {
  protected readonly AlertStatus = AlertStatus;

  private readonly alerts = inject(ALERT_REPOSITORY);

  /** Each transition with the name of its rule; a deleted rule still shows its history. */
  protected readonly history = resource({
    loader: async () => {
      const [transitions, rules] = await Promise.all([this.alerts.getAlertHistory(), this.alerts.getAlertRules()]);
      const rulesById = new Map(rules.map((rule) => [rule.id, rule]));

      return transitions.map((transition) => {
        const rule = rulesById.get(transition.ruleId);
        return {
          transition,
          ruleName: rule?.name ?? 'Deleted rule',
          value: rule ? formatAlertValue(rule.aggregate, transition.value) : String(transition.value),
        };
      });
    },
  });

  ionViewWillEnter(): void {
    this.history.reload();
  }
}
