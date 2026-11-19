import type { RedPoint } from './red-point';
import type { ServiceRed } from './service-red';

export function summarizeServiceRed(points: RedPoint[], windowMs: number): ServiceRed[] {
  const pointsByService = getPointsByService(points);
  const summary: ServiceRed[] = [];

  for (const [service, group] of pointsByService) {
    let requests = 0;
    let errors = 0;
    let worstP99Ns = 0;

    for (const point of group) {
      requests += point.requestCount;
      errors += point.errorCount;
      worstP99Ns = Math.max(worstP99Ns, point.p99Ns);
    }

    const serviceRed: ServiceRed = {
      service,
      rps: requests / (windowMs / 1000),
      errorRate: requests === 0 ? 0 : errors / requests,
      p99Ns: worstP99Ns,
    };

    summary.push(serviceRed);
  }

  return summary.sort((a, b) => a.service.localeCompare(b.service));
}

function getPointsByService(points: RedPoint[]): Map<string, RedPoint[]> {
  const pointsByService = new Map<string, RedPoint[]>();

  for (const point of points) {
    const serviceList = pointsByService.get(point.service);

    if (serviceList === undefined) {
      pointsByService.set(point.service, [point]);
      continue;
    }

    serviceList.push(point);
  }

  return pointsByService;
}
