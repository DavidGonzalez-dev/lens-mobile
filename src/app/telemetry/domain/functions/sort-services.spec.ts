import { describe, expect, it } from 'vitest';

import type { ServiceRed } from '../entities/service-red';

import { sortServices } from './sort-services';

function makeService(overrides: Partial<ServiceRed>): ServiceRed {
  return { service: 'checkout', rps: 1, errorRate: 0, p99Ns: 0, ...overrides };
}

const SERVICES = [
  makeService({ service: 'catalog', errorRate: 0.01, p99Ns: 300 }),
  makeService({ service: 'payment', errorRate: 0.5, p99Ns: 100 }),
  makeService({ service: 'checkout', errorRate: 0.1, p99Ns: 900 }),
];

function names(services: ServiceRed[]): string[] {
  return services.map((service) => service.service);
}

describe('sortServices', () => {
  it('puts the highest error rate first', () => {
    expect(names(sortServices(SERVICES, 'errors'))).toEqual(['payment', 'checkout', 'catalog']);
  });

  it('puts the slowest p99 first', () => {
    expect(names(sortServices(SERVICES, 'latency'))).toEqual(['checkout', 'catalog', 'payment']);
  });

  it('breaks ties by service name', () => {
    const tied = [makeService({ service: 'payment' }), makeService({ service: 'catalog' })];

    expect(names(sortServices(tied, 'errors'))).toEqual(['catalog', 'payment']);
    expect(names(sortServices(tied, 'latency'))).toEqual(['catalog', 'payment']);
  });

  it('does not change the input list', () => {
    const input = [...SERVICES];

    sortServices(input, 'errors');

    expect(names(input)).toEqual(['catalog', 'payment', 'checkout']);
  });

  it('returns an empty list for no services', () => {
    expect(sortServices([], 'latency')).toEqual([]);
  });
});
