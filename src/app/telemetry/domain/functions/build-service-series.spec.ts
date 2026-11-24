import { describe, expect, it } from 'vitest';

import type { RedPoint } from '../entities/red-point';

import { buildServiceSeries } from './build-service-series';

function makePoint(overrides: Partial<RedPoint>): RedPoint {
  return {
    service: 'checkout',
    name: 'POST /checkout',
    minuteMs: 0,
    requestCount: 1,
    errorCount: 0,
    p50Ns: 0,
    p90Ns: 0,
    p99Ns: 0,
    ...overrides,
  };
}

describe('buildServiceSeries', () => {
  it('returns nothing for no points', () => {
    expect(buildServiceSeries([])).toEqual([]);
  });

  it('adds counts and keeps the worst percentiles of the same minute', () => {
    const points = [
      makePoint({ name: 'a', requestCount: 3, errorCount: 1, p50Ns: 5, p90Ns: 8, p99Ns: 10 }),
      makePoint({ name: 'b', requestCount: 2, errorCount: 0, p50Ns: 1, p90Ns: 20, p99Ns: 40 }),
    ];

    expect(buildServiceSeries(points)).toEqual([
      { minuteMs: 0, requestCount: 5, errorCount: 1, p50Ns: 5, p90Ns: 20, p99Ns: 40 },
    ]);
  });

  it('gives one point per minute, oldest first', () => {
    const points = [
      makePoint({ minuteMs: 120_000 }),
      makePoint({ minuteMs: 0 }),
      makePoint({ minuteMs: 60_000 }),
      makePoint({ minuteMs: 0, name: 'other' }),
    ];

    const series = buildServiceSeries(points);

    expect(series.map((minute) => minute.minuteMs)).toEqual([0, 60_000, 120_000]);
    expect(series[0].requestCount).toBe(2);
  });
});
