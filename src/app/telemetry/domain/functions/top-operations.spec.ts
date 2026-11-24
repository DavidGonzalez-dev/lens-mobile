import { describe, expect, it } from 'vitest';

import type { RedPoint } from '../entities/red-point';

import { topOperationsByLatency } from './top-operations';

function makePoint(overrides: Partial<RedPoint>): RedPoint {
  return {
    service: 'checkout',
    name: 'op',
    minuteMs: 0,
    requestCount: 1,
    errorCount: 0,
    p50Ns: 0,
    p90Ns: 0,
    p99Ns: 0,
    ...overrides,
  };
}

describe('topOperationsByLatency', () => {
  it('returns nothing for no points', () => {
    expect(topOperationsByLatency([])).toEqual([]);
  });

  it('sums requests and keeps the worst p99 of every minute', () => {
    const points = [
      makePoint({ name: 'a', minuteMs: 0, requestCount: 3, p99Ns: 10 }),
      makePoint({ name: 'a', minuteMs: 60_000, requestCount: 4, p99Ns: 30 }),
    ];

    expect(topOperationsByLatency(points)).toEqual([{ name: 'a', requestCount: 7, p99Ns: 30 }]);
  });

  it('puts the slowest first and breaks ties by name', () => {
    const points = [
      makePoint({ name: 'fast', p99Ns: 1 }),
      makePoint({ name: 'zeta', p99Ns: 50 }),
      makePoint({ name: 'alpha', p99Ns: 50 }),
    ];

    expect(topOperationsByLatency(points).map((op) => op.name)).toEqual(['alpha', 'zeta', 'fast']);
  });

  it('keeps only the first 5 by default, or the limit given', () => {
    const points = Array.from({ length: 7 }, (_, i) => makePoint({ name: `op${i}`, p99Ns: i }));

    expect(topOperationsByLatency(points)).toHaveLength(5);
    expect(topOperationsByLatency(points, 2).map((op) => op.name)).toEqual(['op6', 'op5']);
  });
});
