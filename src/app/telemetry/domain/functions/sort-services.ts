import type { ServiceRed } from '../entities/service-red';

/** What the service list is sorted by: worst error rate first, or slowest p99 first. */
export type ServiceSort = 'errors' | 'latency';

/**
 * Returns a NEW sorted list (the input is not changed), worst service first.
 * - 'errors':  errorRate descending.
 * - 'latency': p99Ns descending.
 * Ties are broken by service name, ascending, so the order never jumps between renders.
 */
export function sortServices(services: ServiceRed[], by: ServiceSort): ServiceRed[] {
  const copy = [...services];
  const field = by === 'errors' ? 'errorRate' : 'p99Ns';

  copy.sort((a, b) => b[field] - a[field] || a.service.localeCompare(b.service));
  return copy;
}
