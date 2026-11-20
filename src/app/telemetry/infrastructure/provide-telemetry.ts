import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';

import type { AlertRepository, TelemetryRepository } from '../domain';
import { ALERT_REPOSITORY, TELEMETRY_REPOSITORY } from '../telemetry.tokens';

import { DEFAULT_ALERT_RULES } from './demo/default-alert-rules';
import { generateDataset } from './demo/generate-dataset';
import type { ScenarioId } from './demo/scenarios';
import { InMemoryAlertRepository } from './in-memory/in-memory-alert-repository';
import { InMemoryTelemetryRepository } from './in-memory/in-memory-telemetry-repository';

/** Fixed seed: every launch generates the same traffic, so the demo is reproducible. */
export const DEMO_SEED = 42;
/** Incident playing in the last 15 minutes of the demo day. */
export const DEMO_SCENARIO: ScenarioId = 'dependency-503';

export function createTelemetryRepository(nowMs: number): TelemetryRepository {
  // TODO(T4): when Capacitor.isNativePlatform(), return the SQLite repository instead.
  return new InMemoryTelemetryRepository(generateDataset(DEMO_SEED, nowMs, DEMO_SCENARIO), nowMs);
}

export function createAlertRepository(): AlertRepository {
  // TODO(T4): when Capacitor.isNativePlatform(), return the SQLite repository instead.
  return new InMemoryAlertRepository(DEFAULT_ALERT_RULES);
}

/** Registers the telemetry repositories. Add it once, to the providers in main.ts. */
export function provideTelemetry(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: TELEMETRY_REPOSITORY, useFactory: () => createTelemetryRepository(Date.now()) },
    { provide: ALERT_REPOSITORY, useFactory: createAlertRepository },
  ]);
}
