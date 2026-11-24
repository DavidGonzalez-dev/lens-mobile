import { inject, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';

import { ALERT_REPOSITORY, TELEMETRY_DATA_VERSION, TELEMETRY_REPOSITORY } from '../telemetry.tokens';

import { createAlertRepository } from './create-repositories';
import { DemoData } from './demo-data';

/** Registers the telemetry repositories. Add it once, to the providers in main.ts. */
export function provideTelemetry(): EnvironmentProviders {
  return makeEnvironmentProviders([
    // Screens get the switchable repository, so Settings can load another scenario behind it.
    { provide: TELEMETRY_REPOSITORY, useFactory: () => inject(DemoData).repository },
    { provide: TELEMETRY_DATA_VERSION, useFactory: () => inject(DemoData).version },
    { provide: ALERT_REPOSITORY, useFactory: createAlertRepository },
  ]);
}
