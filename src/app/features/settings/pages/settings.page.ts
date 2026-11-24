import { Component, computed, inject, signal } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonRadio,
  IonRadioGroup,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';

import type { ScenarioId } from '../../../telemetry/infrastructure/demo/scenarios';
import { SCENARIO_OPTIONS, type ThemePreference } from '../app-settings';
import { SettingsStore } from '../settings.store';

/** RF-10: data source, demo scenario and theme. */
@Component({
  selector: 'app-settings',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonNote,
    IonRadioGroup,
    IonRadio,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonSegment,
    IonSegmentButton,
  ],
  styles: `
    .hint {
      display: block;
      padding: 4px 16px 12px;
      font-size: 13px;
    }
  `,
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Settings</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-list-header><ion-label>Data source</ion-label></ion-list-header>
        <ion-radio-group value="local">
          <ion-item>
            <ion-radio value="local">Local (on this device)</ion-radio>
          </ion-item>
          <ion-item>
            <ion-radio value="lens" [disabled]="true">Lens server</ion-radio>
          </ion-item>
        </ion-radio-group>
        <ion-note class="hint"
          >This prototype uses simulated data. The Lens server arrives in the final version.</ion-note
        >
      </ion-list>

      <ion-list>
        <ion-list-header><ion-label>Demo scenario</ion-label></ion-list-header>
        <ion-item>
          <ion-select
            label="Incident"
            labelPlacement="stacked"
            [value]="selectedScenario()"
            (ionChange)="selectedScenario.set($event.detail.value)"
          >
            @for (option of scenarios; track option.id) {
              <ion-select-option [value]="option.id">{{ option.label }}</ion-select-option>
            }
          </ion-select>
        </ion-item>
        <ion-note class="hint">
          {{ selectedDescription() }}
          @if (selectedScenario() === store.settings().scenario) {
            (loaded)
          }
        </ion-note>
        <div class="ion-padding-horizontal">
          <ion-button
            expand="block"
            fill="outline"
            [disabled]="selectedScenario() === store.settings().scenario"
            (click)="loadScenario()"
          >
            Load scenario
          </ion-button>
        </div>
      </ion-list>

      <ion-list>
        <ion-list-header><ion-label>Theme</ion-label></ion-list-header>
        <div class="ion-padding-horizontal">
          <ion-segment [value]="store.settings().theme" (ionChange)="setTheme($event.detail.value)">
            <ion-segment-button value="light"><ion-label>Light</ion-label></ion-segment-button>
            <ion-segment-button value="dark"><ion-label>Dark</ion-label></ion-segment-button>
            <ion-segment-button value="system"><ion-label>System</ion-label></ion-segment-button>
          </ion-segment>
        </div>
      </ion-list>
    </ion-content>
  `,
})
export class SettingsPage {
  protected readonly store = inject(SettingsStore);
  private readonly toasts = inject(ToastController);

  protected readonly scenarios = SCENARIO_OPTIONS;
  /** What the select shows; nothing is loaded until the user taps "Load scenario". */
  protected readonly selectedScenario = signal<ScenarioId>(this.store.settings().scenario);
  protected readonly selectedDescription = computed(
    () => SCENARIO_OPTIONS.find((option) => option.id === this.selectedScenario())?.description ?? '',
  );

  protected setTheme(value: unknown): void {
    this.store.setTheme(value as ThemePreference);
  }

  protected async loadScenario(): Promise<void> {
    const scenario = this.selectedScenario();
    this.store.loadScenario(scenario);

    const label = SCENARIO_OPTIONS.find((option) => option.id === scenario)?.label;
    const toast = await this.toasts.create({ message: `${label} loaded`, duration: 1500, position: 'top' });
    await toast.present();
  }
}
