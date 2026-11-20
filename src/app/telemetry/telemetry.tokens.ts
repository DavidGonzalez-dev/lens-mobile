import { InjectionToken } from '@angular/core';

import type { AlertRepository, TelemetryRepository } from './domain';

/**
 * Keys the rest of the app asks Angular for. Screens depend on the port (the interface),
 * never on a concrete repository: `inject(TELEMETRY_REPOSITORY)`.
 * Which class answers is decided once, in provideTelemetry().
 */
export const TELEMETRY_REPOSITORY = new InjectionToken<TelemetryRepository>('TelemetryRepository');
export const ALERT_REPOSITORY = new InjectionToken<AlertRepository>('AlertRepository');
