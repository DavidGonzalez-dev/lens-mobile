import { describe, expect, it } from 'vitest';

import { DEFAULT_ALERT_RULES } from './demo/default-alert-rules';
import { createAlertRepository, createTelemetryRepository } from './provide-telemetry';

const NOW_MS = 1_763_400_000_000;

describe('provideTelemetry factories', () => {
  it('creates a telemetry repository loaded with the demo day', async () => {
    const repository = createTelemetryRepository(NOW_MS);

    const services = await repository.getServiceRed('24h');
    const traces = await repository.getTraces({}, { offset: 0, limit: 10 });

    expect(services.length).toBeGreaterThan(0);
    expect(traces.data).toHaveLength(10);
    expect(traces.hasMore).toBe(true);
  });

  it('creates an alert repository seeded with the default rules', async () => {
    const rules = await createAlertRepository().getAlertRules();

    expect(rules).toHaveLength(DEFAULT_ALERT_RULES.length);
  });

  it('gives each alert repository its own copy of the default rules', async () => {
    const first = createAlertRepository();
    await first.deleteAlertRule(DEFAULT_ALERT_RULES[0].id);

    expect(await createAlertRepository().getAlertRules()).toHaveLength(DEFAULT_ALERT_RULES.length);
  });
});
