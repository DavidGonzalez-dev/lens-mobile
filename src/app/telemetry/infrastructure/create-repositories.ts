import type { AlertRepository, TelemetryRepository } from '../domain';

import { DEFAULT_ALERT_RULES } from './demo/default-alert-rules';
import { generateDataset } from './demo/generate-dataset';
import type { ScenarioId } from './demo/scenarios';
import { InMemoryAlertRepository } from './in-memory/in-memory-alert-repository';
import { InMemoryTelemetryRepository } from './in-memory/in-memory-telemetry-repository';

/** Fixed seed: every launch generates the same traffic, so the demo is reproducible. */
export const DEMO_SEED = 42;
/** Incident playing in the last 15 minutes of the demo day, until Settings loads another. */
export const DEMO_SCENARIO: ScenarioId = 'dependency-503';

export function createTelemetryRepository(nowMs: number, scenario: ScenarioId = DEMO_SCENARIO): TelemetryRepository {
  // TODO(T4): when Capacitor.isNativePlatform(), return the SQLite repository instead.
  return new InMemoryTelemetryRepository(generateDataset(DEMO_SEED, nowMs, scenario), nowMs);
}

export function createAlertRepository(): AlertRepository {
  // TODO(T4): when Capacitor.isNativePlatform(), return the SQLite repository instead.
  return new InMemoryAlertRepository(DEFAULT_ALERT_RULES);
}
