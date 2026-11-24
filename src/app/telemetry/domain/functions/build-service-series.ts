import type { RedPoint } from '../entities/red-point';

/** RED numbers of a whole service in one minute: all its operations added together. */
export interface ServiceMinute {
  minuteMs: number;
  requestCount: number;
  errorCount: number;
  p50Ns: number;
  p90Ns: number;
  p99Ns: number;
}

/**
 * Collapses the per-operation points of ONE service into one point per minute, oldest first.
 * - requestCount / errorCount: SUM of every operation in that minute.
 * - p50Ns / p90Ns / p99Ns: MAX of every operation in that minute. Percentiles cannot be added
 *   or averaged; the slowest operation is the honest "worst case" (same rule as summarizeServiceRed).
 *   [{ minuteMs: 0, name: 'a', requestCount: 3, p99Ns: 10 }, { minuteMs: 0, name: 'b', requestCount: 2, p99Ns: 40 }]
 *     → [{ minuteMs: 0, requestCount: 5, p99Ns: 40, ... }]
 */
export function buildServiceSeries(points: RedPoint[]): ServiceMinute[] {
  const byMinute = new Map<number, ServiceMinute>();

  for (const point of points) {
    const minute = byMinute.get(point.minuteMs);

    if (minute === undefined) {
      byMinute.set(point.minuteMs, {
        minuteMs: point.minuteMs,
        requestCount: point.requestCount,
        errorCount: point.errorCount,
        p50Ns: point.p50Ns,
        p90Ns: point.p90Ns,
        p99Ns: point.p99Ns,
      });
      continue;
    }

    minute.requestCount += point.requestCount;
    minute.errorCount += point.errorCount;
    minute.p50Ns = Math.max(minute.p50Ns, point.p50Ns);
    minute.p90Ns = Math.max(minute.p90Ns, point.p90Ns);
    minute.p99Ns = Math.max(minute.p99Ns, point.p99Ns);
  }

  return [...byMinute.values()].sort((a, b) => a.minuteMs - b.minuteMs);
}
