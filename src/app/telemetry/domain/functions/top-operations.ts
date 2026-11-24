import type { RedPoint } from '../entities/red-point';

/** How slow one operation of a service was over the whole range. */
export interface OperationLatency {
  name: string;
  requestCount: number;
  p99Ns: number;
}

/**
 * The `limit` slowest operations of ONE service (RF-02: top 5 by latency).
 * - Group the points by `name`; requestCount is the SUM, p99Ns the MAX over every minute.
 * - Slowest p99 first; ties by name A→Z. Keep only the first `limit`.
 */
export function topOperationsByLatency(points: RedPoint[], limit: number = 5): OperationLatency[] {
  const byName = new Map<string, OperationLatency>();

  for (const point of points) {
    const operation = byName.get(point.name);

    if (operation === undefined) {
      byName.set(point.name, { name: point.name, requestCount: point.requestCount, p99Ns: point.p99Ns });
      continue;
    }

    operation.requestCount += point.requestCount;
    operation.p99Ns = Math.max(operation.p99Ns, point.p99Ns);
  }

  return [...byName.values()].sort((a, b) => b.p99Ns - a.p99Ns || a.name.localeCompare(b.name)).slice(0, limit);
}
