import { describe, expect, it } from 'vitest';

import { SpanKind, SpanStatusCode, type Span } from '../../telemetry/domain';

import { buildWaterfall } from './waterfall';

const START_MS = 1_763_400_000_000;
const MS = 1_000_000;

function makeSpan(spanId: string, parentSpanId: string | null, startOffsetMs: number, durationMs: number): Span {
  return {
    traceId: 't1',
    spanId,
    parentSpanId,
    service: 'checkout',
    name: spanId,
    kind: SpanKind.SERVER,
    startMs: START_MS + startOffsetMs,
    durationNs: durationMs * MS,
    statusCode: SpanStatusCode.OK,
    statusMessage: null,
    attributes: {},
    events: [],
  };
}

/**
 * root  0 ──────────────────────── 100 ms
 *   a     10 ──── 40
 *     a1     15 ─ 25
 *   b                50 ────── 90
 */
const SPANS = [
  makeSpan('b', 'root', 50, 40),
  makeSpan('a1', 'a', 15, 10),
  makeSpan('root', null, 0, 100),
  makeSpan('a', 'root', 10, 30),
];

describe('buildWaterfall', () => {
  it('orders spans depth-first, children by start time', () => {
    expect(buildWaterfall(SPANS).map((row) => row.span.spanId)).toEqual(['root', 'a', 'a1', 'b']);
  });

  it('gives each span its depth in the tree', () => {
    expect(buildWaterfall(SPANS).map((row) => row.depth)).toEqual([0, 1, 2, 1]);
  });

  it('places each bar as a percentage of the root duration', () => {
    const rows = buildWaterfall(SPANS);

    expect(rows.map((row) => row.offsetPct)).toEqual([0, 10, 15, 50]);
    expect(rows.map((row) => row.widthPct)).toEqual([100, 30, 10, 40]);
  });

  it('breaks start time ties by spanId', () => {
    const spans = [makeSpan('root', null, 0, 10), makeSpan('z', 'root', 1, 1), makeSpan('m', 'root', 1, 1)];

    expect(buildWaterfall(spans).map((row) => row.span.spanId)).toEqual(['root', 'm', 'z']);
  });

  it('does not divide by zero when the root lasts 0 ms', () => {
    const rows = buildWaterfall([makeSpan('root', null, 0, 0)]);

    expect(rows).toEqual([expect.objectContaining({ offsetPct: 0, widthPct: 100 })]);
  });

  it('returns no rows when there is no root', () => {
    expect(buildWaterfall([makeSpan('orphan', 'missing', 0, 10)])).toEqual([]);
  });
});
