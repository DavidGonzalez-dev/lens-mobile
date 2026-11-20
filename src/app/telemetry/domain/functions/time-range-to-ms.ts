import type { TimeRange } from '../entities/time-range';

/** Length of a time range in milliseconds. */
export function timeRangeToMs(range: TimeRange): number {
  switch (range) {
    case '15m':
      return 15 * 60_000;
    case '1h':
      return 1 * 60 * 60_000;
    case '24h':
      return 24 * 60 * 60_000;
  }
}
