import { Injectable, signal } from '@angular/core';

import { DEMO_SCENARIO, createTelemetryRepository } from './create-repositories';
import type { ScenarioId } from './demo/scenarios';
import { SwitchableTelemetryRepository } from './switchable-telemetry-repository';

/**
 * Owns the demo telemetry: which scenario is loaded and the repository that serves it.
 * Loading another scenario regenerates the day of traffic and bumps `version`.
 */
@Injectable({ providedIn: 'root' })
export class DemoData {
  private readonly _scenario = signal<ScenarioId>(DEMO_SCENARIO);
  private readonly _version = signal(0);

  readonly scenario = this._scenario.asReadonly();
  readonly version = this._version.asReadonly();
  readonly repository = new SwitchableTelemetryRepository(createTelemetryRepository(Date.now(), DEMO_SCENARIO));

  load(scenario: ScenarioId): void {
    this.repository.replace(createTelemetryRepository(Date.now(), scenario));
    this._scenario.set(scenario);
    this._version.update((version) => version + 1);
  }
}
