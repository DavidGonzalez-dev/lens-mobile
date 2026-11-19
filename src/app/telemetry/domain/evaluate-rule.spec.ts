import { describe, expect, it } from 'vitest';

import { Aggregate, AlertStatus, type AlertRule } from './alert-rule';
import { evaluateRule } from './evaluate-rule';
import type { RedPoint } from './red-point';

const MINUTE_MS = 60_000;
const MS = 1_000_000;
const NOW_MS = 10 * MINUTE_MS;

/** Error rate above 5% on checkout over the last 5 minutes. */
function makeRule(overrides: Partial<AlertRule>): AlertRule {
  return {
    id: 'rule-1',
    name: 'Checkout errors',
    service: 'checkout',
    aggregate: Aggregate.ERROR_RATE,
    threshold: 0.05,
    windowMin: 5,
    enabled: true,
    status: AlertStatus.OK,
    updatedAtMs: 0,
    ...overrides,
  };
}

/** A healthy checkout minute inside the window; each test overrides what it needs. */
function makePoint(overrides: Partial<RedPoint>): RedPoint {
  return {
    service: 'checkout',
    name: 'POST /orders',
    minuteMs: 9 * MINUTE_MS,
    requestCount: 60,
    errorCount: 0,
    p50Ns: 10 * MS,
    p90Ns: 20 * MS,
    p99Ns: 30 * MS,
    ...overrides,
  };
}

describe('evaluateRule', () => {
  it('fires when the error rate is above the threshold', () => {
    const points = [
      makePoint({ minuteMs: 5 * MINUTE_MS, errorCount: 6 }),
      makePoint({ minuteMs: 6 * MINUTE_MS, errorCount: 6 }),
    ];

    expect(evaluateRule(makeRule({}), points, NOW_MS)).toEqual({
      value: 0.1,
      status: AlertStatus.FIRING,
    });
  });

  it('stays OK when the value is exactly the threshold', () => {
    const points = [makePoint({ errorCount: 3 })];

    expect(evaluateRule(makeRule({}), points, NOW_MS)).toEqual({
      value: 0.05,
      status: AlertStatus.OK,
    });
  });

  it('evaluates p99 rules with the worst p99 of the window', () => {
    const rule = makeRule({ aggregate: Aggregate.P99, threshold: 100 * MS });
    const points = [
      makePoint({ minuteMs: 7 * MINUTE_MS, p99Ns: 30 * MS }),
      makePoint({ minuteMs: 8 * MINUTE_MS, p99Ns: 200 * MS }),
    ];

    expect(evaluateRule(rule, points, NOW_MS)).toEqual({
      value: 200 * MS,
      status: AlertStatus.FIRING,
    });
  });

  it('evaluates rps rules over the whole window', () => {
    const rule = makeRule({ aggregate: Aggregate.RPS, threshold: 0.5 });
    const points = [
      makePoint({ minuteMs: 5 * MINUTE_MS, requestCount: 150 }),
      makePoint({ minuteMs: 6 * MINUTE_MS, requestCount: 150 }),
    ];

    expect(evaluateRule(rule, points, NOW_MS)).toEqual({ value: 1, status: AlertStatus.FIRING });
  });

  it('ignores points older than the window', () => {
    const points = [
      makePoint({ minuteMs: 4 * MINUTE_MS, errorCount: 60 }),
      makePoint({ minuteMs: 9 * MINUTE_MS, errorCount: 0 }),
    ];

    expect(evaluateRule(makeRule({}), points, NOW_MS)).toEqual({
      value: 0,
      status: AlertStatus.OK,
    });
  });

  it('ignores points of other services', () => {
    const points = [makePoint({ service: 'payment', errorCount: 60 }), makePoint({})];

    expect(evaluateRule(makeRule({}), points, NOW_MS).value).toBe(0);
  });

  it('reports 0 and OK when the service had no traffic in the window', () => {
    expect(evaluateRule(makeRule({}), [], NOW_MS)).toEqual({ value: 0, status: AlertStatus.OK });
  });

  it('a disabled rule never fires, but still reports its value', () => {
    const rule = makeRule({ enabled: false });
    const points = [makePoint({ errorCount: 60 })];

    expect(evaluateRule(rule, points, NOW_MS)).toEqual({ value: 1, status: AlertStatus.OK });
  });
});
