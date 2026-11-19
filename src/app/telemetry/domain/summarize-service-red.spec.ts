import { describe, expect, it } from 'vitest';

import type { RedPoint } from './red-point';
import { summarizeServiceRed } from './summarize-service-red';

const MINUTE_MS = 60_000;
const MS = 1_000_000;

/** Builds a RED point; each test overrides only the fields it cares about. */
function makePoint(overrides: Partial<RedPoint>): RedPoint {
  return {
    service: 'checkout',
    name: 'POST /orders',
    minuteMs: 0,
    requestCount: 60,
    errorCount: 0,
    p50Ns: 10 * MS,
    p90Ns: 20 * MS,
    p99Ns: 30 * MS,
    ...overrides,
  };
}

describe('summarizeServiceRed', () => {
  it('returns an empty list when there are no points', () => {
    expect(summarizeServiceRed([], 15 * MINUTE_MS)).toEqual([]);
  });

  it('summarizes one service over the window', () => {
    const points = [
      makePoint({ minuteMs: 0, requestCount: 60, errorCount: 3, p99Ns: 30 * MS }),
      makePoint({ minuteMs: MINUTE_MS, requestCount: 60, errorCount: 9, p99Ns: 80 * MS }),
    ];

    expect(summarizeServiceRed(points, 2 * MINUTE_MS)).toEqual([
      { service: 'checkout', rps: 1, errorRate: 0.1, p99Ns: 80 * MS },
    ]);
  });

  it('divides by the whole window, not by the minutes that had traffic', () => {
    const points = [makePoint({ requestCount: 120 })];

    const [summary] = summarizeServiceRed(points, 2 * MINUTE_MS);

    expect(summary.rps).toBe(1);
  });

  it('adds up every operation of the same service', () => {
    const points = [
      makePoint({ name: 'POST /orders', requestCount: 30, errorCount: 3 }),
      makePoint({ name: 'GET /orders', requestCount: 30, errorCount: 0 }),
    ];

    const [summary] = summarizeServiceRed(points, MINUTE_MS);

    expect(summary.rps).toBe(1);
    expect(summary.errorRate).toBe(0.05);
  });

  it('uses the worst p99 of the window as the approximation', () => {
    const points = [
      makePoint({ minuteMs: 0, p99Ns: 30 * MS }),
      makePoint({ minuteMs: MINUTE_MS, p99Ns: 200 * MS }),
      makePoint({ minuteMs: 2 * MINUTE_MS, p99Ns: 40 * MS }),
    ];

    expect(summarizeServiceRed(points, 3 * MINUTE_MS)[0].p99Ns).toBe(200 * MS);
  });

  it('reports a 0 error rate instead of NaN when there are no requests', () => {
    const points = [makePoint({ requestCount: 0, errorCount: 0 })];

    expect(summarizeServiceRed(points, MINUTE_MS)[0].errorRate).toBe(0);
  });

  it('creates one summary per service, sorted by name', () => {
    const points = [
      makePoint({ service: 'payment' }),
      makePoint({ service: 'checkout' }),
      makePoint({ service: 'payment' }),
    ];

    const services = summarizeServiceRed(points, MINUTE_MS).map((summary) => summary.service);

    expect(services).toEqual(['checkout', 'payment']);
  });
});
