import { describe, expect, it } from 'vitest';

import { timeRangeToMs } from './time-range-to-ms';

describe('timeRangeToMs', () => {
  it('converts each range to milliseconds', () => {
    expect(timeRangeToMs('15m')).toBe(15 * 60_000);
    expect(timeRangeToMs('1h')).toBe(60 * 60_000);
    expect(timeRangeToMs('24h')).toBe(24 * 60 * 60_000);
  });
});
