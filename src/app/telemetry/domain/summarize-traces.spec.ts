import { describe, expect, it } from 'vitest';

import { SpanKind, SpanStatusCode, type Span } from './span';
import { summarizeTraces } from './summarize-traces';

/** Builds a healthy span; each test overrides only the fields it cares about. */
function makeSpan(overrides: Partial<Span>): Span {
  return {
    traceId: 'trace-a',
    spanId: 'span-1',
    parentSpanId: null,
    service: 'frontend',
    name: 'GET /checkout',
    kind: SpanKind.SERVER,
    startMs: 1000,
    durationNs: 50_000_000,
    statusCode: SpanStatusCode.OK,
    statusMessage: null,
    attributes: {},
    events: [],
    ...overrides,
  };
}

describe('summarizeTraces', () => {
  it('returns an empty list when there are no spans', () => {
    expect(summarizeTraces([])).toEqual([]);
  });

  it('summarizes a trace from its root span', () => {
    const spans = [
      makeSpan({ spanId: 'root', durationNs: 120_000_000 }),
      makeSpan({ spanId: 'child', parentSpanId: 'root', service: 'checkout', startMs: 1003 }),
    ];

    expect(summarizeTraces(spans)).toEqual([
      {
        traceId: 'trace-a',
        rootService: 'frontend',
        rootName: 'GET /checkout',
        startMs: 1000,
        durationNs: 120_000_000,
        spanCount: 2,
        hasError: false,
      },
    ]);
  });

  it('finds the root even when it is not the first span', () => {
    const spans = [
      makeSpan({ spanId: 'child', parentSpanId: 'root', service: 'checkout' }),
      makeSpan({ spanId: 'root', service: 'frontend' }),
    ];

    expect(summarizeTraces(spans)[0].rootService).toBe('frontend');
  });

  it('marks the trace as failed when any span has an error', () => {
    const spans = [
      makeSpan({ spanId: 'root' }),
      makeSpan({ spanId: 'child', parentSpanId: 'root', statusCode: SpanStatusCode.ERROR }),
    ];

    expect(summarizeTraces(spans)[0].hasError).toBe(true);
  });

  it('creates one summary per trace, newest first', () => {
    const spans = [
      makeSpan({ traceId: 'old', spanId: 'r1', startMs: 1000 }),
      makeSpan({ traceId: 'new', spanId: 'r2', startMs: 5000 }),
      makeSpan({ traceId: 'old', spanId: 'c1', parentSpanId: 'r1', startMs: 1002 }),
    ];

    const traces = summarizeTraces(spans);

    expect(traces.map((trace) => trace.traceId)).toEqual(['new', 'old']);
    expect(traces.map((trace) => trace.spanCount)).toEqual([1, 2]);
  });

  it('breaks start time ties by traceId', () => {
    const spans = [
      makeSpan({ traceId: 'b', spanId: 'r1', startMs: 1000 }),
      makeSpan({ traceId: 'a', spanId: 'r2', startMs: 1000 }),
    ];

    expect(summarizeTraces(spans).map((trace) => trace.traceId)).toEqual(['a', 'b']);
  });

  it('skips traces without a root span', () => {
    const spans = [makeSpan({ traceId: 'orphan', spanId: 'c1', parentSpanId: 'missing' })];

    expect(summarizeTraces(spans)).toEqual([]);
  });
});
