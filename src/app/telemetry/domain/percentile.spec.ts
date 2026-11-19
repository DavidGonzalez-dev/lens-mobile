import { describe, expect, it } from 'vitest';

import { percentile } from './percentile';

describe('percentile', () => {
  it('returns the only value of a one-item list', () => {
    expect(percentile([7], 50)).toBe(7);
    expect(percentile([7], 99)).toBe(7);
  });

  it('uses the nearest rank: the smallest value with at least p% of values at or below it', () => {
    const values = [10, 20, 30, 40];

    expect(percentile(values, 50)).toBe(20);
    expect(percentile(values, 90)).toBe(40);
  });

  it('p99 of 1..100 is 99', () => {
    const values = Array.from({ length: 100 }, (_, index) => index + 1);

    expect(percentile(values, 99)).toBe(99);
  });

  it('works with unsorted values and does not modify the input', () => {
    const values = [40, 10, 30, 20];

    expect(percentile(values, 50)).toBe(20);
    expect(values).toEqual([40, 10, 30, 20]);
  });

  it('returns 0 for an empty list', () => {
    expect(percentile([], 99)).toBe(0);
  });
});
