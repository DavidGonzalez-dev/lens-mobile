import { Component, computed, effect, inject, input, resource, signal } from '@angular/core';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToggle,
  IonToolbar,
  NavController,
} from '@ionic/angular';

import { Aggregate } from '../../../telemetry/domain';
import { ALERT_REPOSITORY, TELEMETRY_REPOSITORY } from '../../../telemetry/telemetry.tokens';
import {
  AGGREGATE_LABELS,
  EMPTY_RULE_FORM,
  toAlertRule,
  toRuleForm,
  validateRuleForm,
  type AlertRuleForm,
} from '../alert-rule-form';

/** RF-07: create a rule (no ruleId) or edit / delete one (ruleId from the route). */
@Component({
  selector: 'app-alert-rule-edit',
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonNote,
    IonText,
    IonButton,
    IonSpinner,
  ],
  styles: `
    .error {
      display: block;
      padding: 4px 16px 0;
      font-size: 13px;
    }
  `,
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/alerts" />
        </ion-buttons>
        <ion-title>{{ ruleId() ? 'Edit rule' : 'New rule' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (data.error()) {
        <div class="ion-padding ion-text-center">
          <ion-text color="danger"><p>Could not load the rule.</p></ion-text>
          <ion-button (click)="data.reload()">Retry</ion-button>
        </div>
      } @else if (!data.hasValue()) {
        <div class="ion-padding ion-text-center"><ion-spinner /></div>
      } @else if (ruleId() && !data.value().rule) {
        <p class="ion-padding ion-text-center">This rule does not exist.</p>
      } @else {
        <ion-list>
          <ion-item>
            <ion-input
              label="Name"
              labelPlacement="stacked"
              [maxlength]="60"
              [value]="form().name"
              (ionInput)="patch({ name: $event.detail.value ?? '' })"
            />
          </ion-item>
          @if (shownErrors().name; as error) {
            <ion-note class="error" color="danger">{{ error }}</ion-note>
          }

          <ion-item>
            <ion-select
              label="Service"
              labelPlacement="stacked"
              placeholder="Pick a service"
              [value]="form().service"
              (ionChange)="patch({ service: $event.detail.value })"
            >
              @for (service of data.value().services; track service) {
                <ion-select-option [value]="service">{{ service }}</ion-select-option>
              }
            </ion-select>
          </ion-item>
          @if (shownErrors().service; as error) {
            <ion-note class="error" color="danger">{{ error }}</ion-note>
          }

          <ion-item>
            <ion-select
              label="Metric"
              labelPlacement="stacked"
              [value]="form().aggregate"
              (ionChange)="patch({ aggregate: $event.detail.value })"
            >
              @for (aggregate of aggregates; track aggregate) {
                <ion-select-option [value]="aggregate">{{ AGGREGATE_LABELS[aggregate] }}</ion-select-option>
              }
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-input
              type="number"
              inputmode="decimal"
              labelPlacement="stacked"
              [label]="'Threshold: ' + AGGREGATE_LABELS[form().aggregate]"
              [value]="form().threshold"
              (ionInput)="patch({ threshold: toNumber($event.detail.value) })"
            />
          </ion-item>
          @if (shownErrors().threshold; as error) {
            <ion-note class="error" color="danger">{{ error }}</ion-note>
          }

          <ion-item>
            <ion-input
              type="number"
              inputmode="numeric"
              label="Window (minutes)"
              labelPlacement="stacked"
              [value]="form().windowMin"
              (ionInput)="patch({ windowMin: toNumber($event.detail.value) })"
            />
          </ion-item>
          @if (shownErrors().windowMin; as error) {
            <ion-note class="error" color="danger">{{ error }}</ion-note>
          }

          <ion-item>
            <ion-toggle [checked]="form().enabled" (ionChange)="patch({ enabled: $event.detail.checked })">
              Enabled
            </ion-toggle>
          </ion-item>
        </ion-list>

        <div class="ion-padding">
          <ion-button expand="block" [disabled]="saving()" (click)="save()">Save</ion-button>
          @if (ruleId()) {
            <ion-button expand="block" fill="outline" color="danger" [disabled]="saving()" (click)="confirmDelete()">
              Delete
            </ion-button>
          }
        </div>
      }
    </ion-content>
  `,
})
export class AlertRuleEditPage {
  /** Undefined on /alerts/new. */
  readonly ruleId = input<string>();

  protected readonly AGGREGATE_LABELS = AGGREGATE_LABELS;
  protected readonly aggregates = Object.values(Aggregate);

  private readonly alerts = inject(ALERT_REPOSITORY);
  private readonly telemetry = inject(TELEMETRY_REPOSITORY);
  private readonly nav = inject(NavController);
  private readonly alertController = inject(AlertController);

  /** The services to pick from, and the rule being edited (undefined when creating). */
  protected readonly data = resource({
    // Wrapped in an object: a resource whose params are undefined never loads, and on /new ruleId IS undefined.
    params: () => ({ ruleId: this.ruleId() }),
    loader: async ({ params: { ruleId } }) => {
      const [red, rules] = await Promise.all([this.telemetry.getServiceRed('24h'), this.alerts.getAlertRules()]);
      return {
        services: red.map((service) => service.service),
        rule: rules.find((rule) => rule.id === ruleId),
      };
    },
  });

  protected readonly form = signal<AlertRuleForm>(EMPTY_RULE_FORM);
  /** Errors stay hidden until the first Save, so an untouched form is not all red. */
  private readonly submitted = signal(false);
  protected readonly saving = signal(false);

  private readonly errors = computed(() =>
    validateRuleForm(this.form(), this.data.hasValue() ? this.data.value().services : []),
  );
  protected readonly shownErrors = computed(() => (this.submitted() ? this.errors() : {}));

  constructor() {
    // When the rule being edited arrives, fill the form with it.
    effect(() => {
      const rule = this.data.hasValue() ? this.data.value().rule : undefined;
      if (rule !== undefined) {
        this.form.set(toRuleForm(rule));
      }
    });
  }

  protected patch(changes: Partial<AlertRuleForm>): void {
    this.form.update((form) => ({ ...form, ...changes }));
  }

  /** ion-input gives text (or null); an empty box is null, not 0. */
  protected toNumber(value: string | null | undefined): number | null {
    return value === null || value === undefined || value === '' ? null : Number(value);
  }

  protected async save(): Promise<void> {
    this.submitted.set(true);
    if (Object.keys(this.errors()).length > 0) {
      return;
    }

    this.saving.set(true);
    try {
      const existing = this.data.hasValue() ? this.data.value().rule : undefined;
      if (existing === undefined) {
        await this.alerts.createAlertRule(toAlertRule(this.form(), crypto.randomUUID(), Date.now()));
      } else {
        await this.alerts.updateAlertRule(toAlertRule(this.form(), existing.id, Date.now(), existing));
      }
      await this.nav.navigateBack('/tabs/alerts');
    } finally {
      this.saving.set(false);
    }
  }

  protected async confirmDelete(): Promise<void> {
    const dialog = await this.alertController.create({
      header: 'Delete rule?',
      message: 'Its history is kept.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive', handler: () => void this.delete() },
      ],
    });
    await dialog.present();
  }

  private async delete(): Promise<void> {
    const id = this.ruleId();
    if (id === undefined) {
      return;
    }
    await this.alerts.deleteAlertRule(id);
    await this.nav.navigateBack('/tabs/alerts');
  }
}
