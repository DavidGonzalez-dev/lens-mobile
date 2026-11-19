import { describe, expect, it } from 'vitest';

import { criticalPath } from './critical-path';
import { SpanKind, SpanStatusCode, type Span } from './span';

/** Builds a span that runs from `startMs` to `startMs + durationMs`. */
function makeSpan(spanId: string, parentSpanId: string | null, startMs: number, durationMs: number): Span {
  return {
    traceId: 'trace-a',
    spanId,
    parentSpanId,
    service: 'checkout',
    name: spanId,
    kind: SpanKind.SERVER,
    startMs,
    durationNs: durationMs * 1_000_000,
    statusCode: SpanStatusCode.OK,
    statusMessage: null,
    attributes: {},
    events: [],
  };
}

/** Order does not matter, so compare as sets. */
function idsOf(spans: Span[]): Set<string> {
  return new Set(criticalPath(spans));
}

describe('criticalPath', () => {
  it('returns an empty list when there are no spans', () => {
    expect(criticalPath([])).toEqual([]);
  });

  it('returns an empty list when the trace has no root', () => {
    expect(criticalPath([makeSpan('child', 'missing', 0, 10)])).toEqual([]);
  });

  it('a lone root is the whole critical path', () => {
    expect(criticalPath([makeSpan('root', null, 0, 10)])).toEqual(['root']);
  });

  it('includes every child that runs one after the other', () => {
    //  root  |==========================|  0..60
    //  a      |=====|                      2..12
    //  b             |==================|  12..60
    const spans = [makeSpan('root', null, 0, 60), makeSpan('a', 'root', 2, 10), makeSpan('b', 'root', 12, 48)];

    expect(idsOf(spans)).toEqual(new Set(['root', 'a', 'b']));
  });

  it('only includes the longest of children that run in parallel', () => {
    //  root  |==========================|  0..52
    //  fast   |====|                       1..11
    //  slow   |=========================|  1..51
    const spans = [makeSpan('root', null, 0, 52), makeSpan('fast', 'root', 1, 10), makeSpan('slow', 'root', 1, 50)];

    expect(idsOf(spans)).toEqual(new Set(['root', 'slow']));
  });

  it('goes down into the critical child only', () => {
    //  root      |=========================|  0..52
    //  fast       |====|                      1..11
    //  fast-db     |==|                       2..8
    //  slow       |=========================| 1..51
    //  slow-db     |=======================|  2..50
    const spans = [
      makeSpan('root', null, 0, 52),
      makeSpan('fast', 'root', 1, 10),
      makeSpan('fast-db', 'fast', 2, 6),
      makeSpan('slow', 'root', 1, 50),
      makeSpan('slow-db', 'slow', 2, 48),
    ];

    expect(idsOf(spans)).toEqual(new Set(['root', 'slow', 'slow-db']));
  });

  it('finds the root even when it is not the first span', () => {
    const spans = [makeSpan('a', 'root', 1, 5), makeSpan('root', null, 0, 10)];

    expect(idsOf(spans)).toEqual(new Set(['root', 'a']));
  });
});
