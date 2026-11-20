import { describe, expect, it } from 'vitest';

import { SpanKind, SpanStatusCode, type Span, type TraceQuery } from '../../domain';

import { InMemoryTelemetryRepository } from './in-memory-telemetry-repository';

const MINUTE_MS = 60_000;
const NOW_MS = 1_763_400_000_000;

/** Builds a healthy checkout root span; each test overrides only the fields it cares about. */
function makeSpan(overrides: Partial<Span>): Span {
  return {
    traceId: 'trace-a',
    spanId: 'span-1',
    parentSpanId: null,
    service: 'checkout',
    name: 'POST /orders',
    kind: SpanKind.SERVER,
    startMs: NOW_MS - MINUTE_MS,
    durationNs: 10_000_000,
    statusCode: SpanStatusCode.OK,
    statusMessage: null,
    attributes: {},
    events: [],
    ...overrides,
  };
}

describe('InMemoryTelemetryRepository', () => {
  describe('getServiceRed', () => {
    it('summarizes one entry per service', async () => {
      const repository = new InMemoryTelemetryRepository(
        [
          makeSpan({ traceId: 't1', service: 'checkout' }),
          makeSpan({ traceId: 't2', service: 'payment', name: 'charge card' }),
        ],
        NOW_MS,
      );

      const services = await repository.getServiceRed('15m');

      expect(services.map((service) => service.service)).toEqual(['checkout', 'payment']);
    });

    it('only uses the spans inside the range', async () => {
      const repository = new InMemoryTelemetryRepository(
        [
          makeSpan({ traceId: 't1', startMs: NOW_MS - 1 * MINUTE_MS, statusCode: SpanStatusCode.ERROR }),
          makeSpan({ traceId: 't2', startMs: NOW_MS - 20 * MINUTE_MS }),
        ],
        NOW_MS,
      );

      const [last15m] = await repository.getServiceRed('15m');
      const [lastHour] = await repository.getServiceRed('1h');

      expect(last15m.errorRate).toBe(1);
      expect(lastHour.errorRate).toBe(0.5);
    });
  });

  describe('getRedSeries', () => {
    it('returns the points of one service inside the range, oldest first', async () => {
      const repository = new InMemoryTelemetryRepository(
        [
          makeSpan({ traceId: 't1', startMs: NOW_MS - 2 * MINUTE_MS }),
          makeSpan({ traceId: 't2', startMs: NOW_MS - 5 * MINUTE_MS }),
          makeSpan({ traceId: 't3', startMs: NOW_MS - 30 * MINUTE_MS }),
          makeSpan({ traceId: 't4', service: 'payment', name: 'charge card' }),
        ],
        NOW_MS,
      );

      const series = await repository.getRedSeries('checkout', '15m');

      expect(series).toHaveLength(2);
      expect(series.every((point) => point.service === 'checkout')).toBe(true);
      expect(series[0].minuteMs).toBeLessThan(series[1].minuteMs);
    });
  });

  describe('getTraces', () => {
    const ALL = { offset: 0, limit: 50 };

    /**
     * t1: checkout root at -1m, 10ms, healthy, with a `payment / charge card` child.
     * t2: checkout root at -5m, 300ms, with an error.
     * t3: catalog root at -30m, 50ms, healthy.
     */
    function createRepository(): InMemoryTelemetryRepository {
      return new InMemoryTelemetryRepository(
        [
          makeSpan({ traceId: 't1', spanId: 't1-root', startMs: NOW_MS - 1 * MINUTE_MS }),
          makeSpan({
            traceId: 't1',
            spanId: 't1-child',
            parentSpanId: 't1-root',
            service: 'payment',
            name: 'charge card',
            kind: SpanKind.CLIENT,
            startMs: NOW_MS - 1 * MINUTE_MS,
            durationNs: 5_000_000,
          }),
          makeSpan({
            traceId: 't2',
            spanId: 't2-root',
            startMs: NOW_MS - 5 * MINUTE_MS,
            durationNs: 300_000_000,
            statusCode: SpanStatusCode.ERROR,
          }),
          makeSpan({
            traceId: 't3',
            spanId: 't3-root',
            service: 'catalog',
            name: 'GET /products',
            startMs: NOW_MS - 30 * MINUTE_MS,
            durationNs: 50_000_000,
          }),
        ],
        NOW_MS,
      );
    }

    async function traceIds(query: TraceQuery): Promise<string[]> {
      const page = await createRepository().getTraces(query, ALL);
      return page.data.map((trace) => trace.traceId);
    }

    it('returns every trace, newest first, when the query is empty', async () => {
      expect(await traceIds({})).toEqual(['t1', 't2', 't3']);
    });

    it('filters by a service that appears in any span, not only the root', async () => {
      expect(await traceIds({ serviceName: 'payment' })).toEqual(['t1']);
    });

    it('filters by an operation that appears in any span', async () => {
      expect(await traceIds({ operation: 'charge card' })).toEqual(['t1']);
    });

    it('filters by minimum duration', async () => {
      expect(await traceIds({ minDurationNs: 50_000_000 })).toEqual(['t2', 't3']);
    });

    it('filters by error', async () => {
      expect(await traceIds({ hasError: true })).toEqual(['t2']);
      expect(await traceIds({ hasError: false })).toEqual(['t1', 't3']);
    });

    it('filters by time range', async () => {
      expect(await traceIds({ range: '15m' })).toEqual(['t1', 't2']);
    });

    it('includes a trace starting exactly at the range start and excludes one starting at now', async () => {
      const repository = new InMemoryTelemetryRepository(
        [
          makeSpan({ traceId: 'at-start', startMs: NOW_MS - 15 * MINUTE_MS }),
          makeSpan({ traceId: 'at-now', startMs: NOW_MS }),
        ],
        NOW_MS,
      );

      const page = await repository.getTraces({ range: '15m' }, ALL);

      expect(page.data.map((trace) => trace.traceId)).toEqual(['at-start']);
    });

    it('applies every filter at once', async () => {
      expect(await traceIds({ serviceName: 'checkout', range: '15m', minDurationNs: 100_000_000 })).toEqual(['t2']);
    });

    it('paginates the filtered traces', async () => {
      const repository = createRepository();

      const first = await repository.getTraces({}, { offset: 0, limit: 2 });
      const second = await repository.getTraces({}, { offset: 2, limit: 2 });

      expect(first).toEqual({
        data: [expect.objectContaining({ traceId: 't1' }), expect.objectContaining({ traceId: 't2' })],
        hasMore: true,
      });
      expect(second.data.map((trace) => trace.traceId)).toEqual(['t3']);
      expect(second.hasMore).toBe(false);
    });
  });

  describe('getSpansFromTrace', () => {
    it('returns every span of the trace', async () => {
      const repository = new InMemoryTelemetryRepository(
        [
          makeSpan({ traceId: 't1', spanId: 'root' }),
          makeSpan({ traceId: 't1', spanId: 'child', parentSpanId: 'root' }),
          makeSpan({ traceId: 't2', spanId: 'other' }),
        ],
        NOW_MS,
      );

      const spans = await repository.getSpansFromTrace('t1');

      expect(spans.map((span) => span.spanId)).toEqual(['root', 'child']);
    });

    it('returns an empty list for an unknown trace', async () => {
      const repository = new InMemoryTelemetryRepository([makeSpan({})], NOW_MS);

      expect(await repository.getSpansFromTrace('missing')).toEqual([]);
    });
  });
});
