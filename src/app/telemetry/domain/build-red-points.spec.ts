import { describe, expect, it } from 'vitest';

import { buildRedPoints } from './build-red-points';
import { SpanKind, SpanStatusCode, type Span } from './span';

const MINUTE_MS = 60_000;
const MS = 1_000_000;

/** Builds a healthy SERVER span; each test overrides only the fields it cares about. */
function makeSpan(overrides: Partial<Span>): Span {
  return {
    traceId: 'trace-a',
    spanId: 'span-1',
    parentSpanId: null,
    service: 'checkout',
    name: 'POST /orders',
    kind: SpanKind.SERVER,
    startMs: 0,
    durationNs: 10 * MS,
    statusCode: SpanStatusCode.OK,
    statusMessage: null,
    attributes: {},
    events: [],
    ...overrides,
  };
}

describe('buildRedPoints', () => {
  it('returns an empty list when there are no spans', () => {
    expect(buildRedPoints([])).toEqual([]);
  });

  it('builds one point per service, operation and minute', () => {
    const spans = [
      makeSpan({ startMs: 5_000, durationNs: 10 * MS }),
      makeSpan({ startMs: 20_000, durationNs: 20 * MS, statusCode: SpanStatusCode.ERROR }),
      makeSpan({ startMs: 59_999, durationNs: 30 * MS }),
    ];

    expect(buildRedPoints(spans)).toEqual([
      {
        service: 'checkout',
        name: 'POST /orders',
        minuteMs: 0,
        requestCount: 3,
        errorCount: 1,
        p50Ns: 20 * MS,
        p90Ns: 30 * MS,
        p99Ns: 30 * MS,
      },
    ]);
  });

  it('puts the minute start in minuteMs', () => {
    const [point] = buildRedPoints([makeSpan({ startMs: 3 * MINUTE_MS + 42_000 })]);

    expect(point.minuteMs).toBe(3 * MINUTE_MS);
  });

  it('separates different minutes, services and operations', () => {
    const spans = [
      makeSpan({ startMs: 0 }),
      makeSpan({ startMs: MINUTE_MS }),
      makeSpan({ startMs: 0, service: 'payment', name: 'charge card' }),
      makeSpan({ startMs: 0, name: 'GET /orders' }),
    ];

    expect(buildRedPoints(spans)).toHaveLength(4);
  });

  it('only counts SERVER spans as requests', () => {
    const spans = [
      makeSpan({}),
      makeSpan({ kind: SpanKind.CLIENT, name: 'SELECT stock' }),
      makeSpan({ kind: SpanKind.INTERNAL, name: 'validate' }),
    ];

    const points = buildRedPoints(spans);

    expect(points).toHaveLength(1);
    expect(points[0].name).toBe('POST /orders');
  });

  it('sorts by minute, then service, then operation', () => {
    const spans = [
      makeSpan({ startMs: MINUTE_MS, service: 'a', name: 'x' }),
      makeSpan({ startMs: 0, service: 'b', name: 'x' }),
      makeSpan({ startMs: 0, service: 'a', name: 'y' }),
      makeSpan({ startMs: 0, service: 'a', name: 'x' }),
    ];

    const order = buildRedPoints(spans).map((p) => `${p.minuteMs}:${p.service}:${p.name}`);

    expect(order).toEqual(['0:a:x', '0:a:y', '0:b:x', `${MINUTE_MS}:a:x`]);
  });
});
