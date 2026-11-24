import { Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { AlertStatus } from '../../../telemetry/domain';
import { ALERT_REPOSITORY, TELEMETRY_REPOSITORY } from '../../../telemetry/telemetry.tokens';
import { AGGREGATE_LABELS, formatAlertValue } from '../alert-rule-form';
import { evaluateAlertRules } from '../evaluate-alert-rules';

/** RF-07: alert rules with their current status. Opening the screen evaluates them (RF-09 history). */
@Component({
  selector: 'app-alert-rules',
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonNote,
    IonText,
    IonSpinner,
  ],
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
      @if (rules.error()) {
        <div class="ion-padding ion-text-center">
          <ion-text color="danger"><p>Could not load the rules.</p></ion-text>
          <ion-button (click)="rules.reload()">Retry</ion-button>
        </div>
      } @else if (!rules.hasValue()) {
        <div class="ion-padding ion-text-center"><ion-spinner /></div>
      } @else if (rules.value().length === 0) {
        <div class="ion-padding ion-text-center">
          <p>No alert rules yet.</p>
          <ion-button routerLink="new">Create one</ion-button>
        </div>
      } @else {
        <ion-list>
          @for (item of rules.value(); track item.rule.id) {
            <ion-item [routerLink]="[item.rule.id, 'edit']" detail>
              <ion-label>
                <h2>{{ item.rule.name }}</h2>
                <p>
                  {{ item.rule.service }} · {{ AGGREGATE_LABELS[item.rule.aggregate] }} &gt;
                  {{ formatAlertValue(item.rule.aggregate, item.rule.threshold) }} · {{ item.rule.windowMin }} min
                </p>
                <p>Now: {{ formatAlertValue(item.rule.aggregate, item.value) }}</p>
              </ion-label>
              @if (!item.rule.enabled) {
                <ion-note slot="end">Disabled</ion-note>
              } @else {
                <ion-badge slot="end" [color]="item.rule.status === AlertStatus.FIRING ? 'danger' : 'success'">
                  {{ item.rule.status === AlertStatus.FIRING ? 'FIRING' : 'OK' }}
                </ion-badge>
              }
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
})
export class AlertRulesPage {
  protected readonly AlertStatus = AlertStatus;
  protected readonly AGGREGATE_LABELS = AGGREGATE_LABELS;
  protected readonly formatAlertValue = formatAlertValue;

  private readonly alerts = inject(ALERT_REPOSITORY);
  private readonly telemetry = inject(TELEMETRY_REPOSITORY);

  protected readonly rules = resource({
    loader: () => evaluateAlertRules(this.alerts, this.telemetry, Date.now()),
  });

  /** Ionic keeps this page alive under the tab: re-evaluate when coming back from the editor. */
  ionViewWillEnter(): void {
    this.rules.reload();
  }
}
