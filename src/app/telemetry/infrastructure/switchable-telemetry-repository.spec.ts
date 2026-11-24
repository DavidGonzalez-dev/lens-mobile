import { describe, expect, it } from 'vitest';

import type { ServiceRed, TelemetryRepository } from '../domain';

import { SwitchableTelemetryRepository } from './switchable-telemetry-repository';

function repositoryWith(service: string): TelemetryRepository {
  const red: ServiceRed = { service, rps: 1, errorRate: 0, p99Ns: 0 };
  return {
    getServiceRed: async () => [red],
    getRedSeries: async () => [],
    getTraces: async () => ({ data: [], hasMore: false }),
    getSpansFromTrace: async () => [],
  };
}

describe('SwitchableTelemetryRepository', () => {
  it('answers from the repository it was created with', async () => {
    const repository = new SwitchableTelemetryRepository(repositoryWith('first'));

    expect((await repository.getServiceRed('15m'))[0].service).toBe('first');
  });

  it('answers from the new repository after replace', async () => {
    const repository = new SwitchableTelemetryRepository(repositoryWith('first'));

    repository.replace(repositoryWith('second'));

    expect((await repository.getServiceRed('15m'))[0].service).toBe('second');
  });
});
