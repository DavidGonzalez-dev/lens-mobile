import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

import type { ScenarioId } from '../../telemetry/infrastructure/demo/scenarios';
import { DemoData } from '../../telemetry/infrastructure/demo-data';

import { parseSettings, shouldUseDark, type AppSettings, type ThemePreference } from './app-settings';

const STORAGE_KEY = 'lens.settings';
/** Class Ionic's dark palette (dark.class.css) looks for on <html>. */
const DARK_CLASS = 'ion-palette-dark';

/** Current settings: applies them (theme, scenario) and remembers them in localStorage. */
@Injectable({ providedIn: 'root' })
export class SettingsStore {
  private readonly document = inject(DOCUMENT);
  private readonly demoData = inject(DemoData);
  private readonly systemDark = this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)');

  private readonly _settings = signal<AppSettings>(parseSettings(this.read()));
  readonly settings = this._settings.asReadonly();

  /** Runs once at startup (provideAppInitializer in main.ts). */
  init(): void {
    this.applyTheme();
    // With 'system', follow the phone when the user switches its theme while the app is open.
    this.systemDark?.addEventListener('change', () => this.applyTheme());

    const { scenario } = this._settings();
    if (scenario !== this.demoData.scenario()) {
      this.demoData.load(scenario);
    }
  }

  setTheme(theme: ThemePreference): void {
    this.save({ ...this._settings(), theme });
    this.applyTheme();
  }

  /** Regenerates the demo day with another incident; every screen reloads by itself. */
  loadScenario(scenario: ScenarioId): void {
    this.save({ ...this._settings(), scenario });
    this.demoData.load(scenario);
  }

  private applyTheme(): void {
    const dark = shouldUseDark(this._settings().theme, this.systemDark?.matches ?? false);
    this.document.documentElement.classList.toggle(DARK_CLASS, dark);
  }

  private save(settings: AppSettings): void {
    this._settings.set(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage full or blocked: the setting still applies for this session.
    }
  }

  private read(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }
}
