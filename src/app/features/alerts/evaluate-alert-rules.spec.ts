import { describe, expect, it } from 'vitest';

import {
  Aggregate,
  AlertStatus,
  type AlertRule,
  type RedPoint,
  type TelemetryRepository,
} from '../../telemetry/domain';
import { InMemoryAlertRepository } from '../../telemetry/infrastructure/in-memory/in-memory-alert-repository';

import { evaluateAlertRules, rangeForWindow } from './evaluate-alert-rules';

const NOW = 10 * 60_000;

const RULE: AlertRule = {
  id: 'r1',
  name: 'Payment errors',
  service: 'payment',
  aggregate: Aggregate.ERROR_RATE,
  threshold: 0.1,
  windowMin: 5,
  enabled: true,
  status: AlertStatus.OK,
  updatedAtMs: 0,
};

/** One point per minute of the last 5 minutes, with the given errors out of 10 requests. */
function telemetryWithErrors(errorCount: number): TelemetryRepository {
  const points: RedPoint[] = [5, 4, 3, 2, 1].map((ago) => ({
    service: 'payment',
    name: 'charge card',
    minuteMs: NOW - ago * 60_000,
    requestCount: 10,
    errorCount,
    p50Ns: 0,
    p90Ns: 0,
    p99Ns: 0,
  }));
  return {
    getServiceRed: async () => [],
    getRedSeries: async () => points,
    getTraces: async () => ({ data: [], hasMore: false }),
    getSpansFromTrace: async () => [],
  };
}

describe('evaluateAlertRules', () => {
  it('fires a rule over its threshold and records the transition', async () => {
    const alerts = new InMemoryAlertRepository([RULE]);

    const [result] = await evaluateAlertRules(alerts, telemetryWithErrors(5), NOW);

    expect(result.value).toBe(0.5);
    expect(result.rule.status).toBe(AlertStatus.FIRING);
    expect((await alerts.getAlertRules())[0].status).toBe(AlertStatus.FIRING);
    expect(await alerts.getAlertHistory()).toHaveLength(1);
  });

  it('records nothing when the status stays the same', async () => {
    const alerts = new InMemoryAlertRepository([RULE]);

    await evaluateAlertRules(alerts, telemetryWithErrors(0), NOW);

    expect(await alerts.getAlertHistory()).toEqual([]);
  });

  it('resolves a firing rule once the errors are gone', async () => {
    const alerts = new InMemoryAlertRepository([{ ...RULE, status: AlertStatus.FIRING }]);

    await evaluateAlertRules(alerts, telemetryWithErrors(0), NOW);

    const [transition] = await alerts.getAlertHistory();
    expect(transition.toStatus).toBe(AlertStatus.OK);
  });
});

describe('rangeForWindow', () => {
  it('picks the smallest range that covers the window', () => {
    expect(rangeForWindow(5)).toBe('15m');
    expect(rangeForWindow(15)).toBe('15m');
    expect(rangeForWindow(30)).toBe('1h');
    expect(rangeForWindow(90)).toBe('24h');
  });
});
