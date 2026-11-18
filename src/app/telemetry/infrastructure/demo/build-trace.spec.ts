import { describe, expect, it } from 'vitest';

import { buildTrace } from './build-trace';
import { mulberry32 } from './random';
import { entryOperations } from './topology';

describe('build-trace', () => {
  it('all children are inside the parent', () => {
    const rng = mulberry32(42);
    const trace = buildTrace(rng, entryOperations[0], 1000);
    const getSpanEndMs = (startMs: number, durationNs: number) => startMs + durationNs / 1_000_000;

    for (const span of trace) {
      if (span.parentSpanId === null) {
        continue;
      }

      const parentSpan = trace.find((targetSpan) => targetSpan.spanId === span.parentSpanId);
      expect(parentSpan).toBeDefined();
      expect(span.startMs).toBeGreaterThanOrEqual(parentSpan!.startMs);
      expect(getSpanEndMs(span.startMs, span.durationNs)).toBeLessThanOrEqual(
        getSpanEndMs(parentSpan!.startMs, parentSpan!.durationNs),
      );
    }
  });

  it('Creates the right amount of spans', () => {
    const rng = mulberry32(42);
    const trace = buildTrace(rng, entryOperations[0], 1000);

    expect(trace.length).toBe(5);
  });

  it('all spans share the same traceId', () => {
    const rng = mulberry32(42);
    const trace = buildTrace(rng, entryOperations[0], 1000);

    const traceId = trace[0].traceId;

    for (const span of trace) {
      expect(span.traceId).toBe(traceId);
    }
  });

  it('the root has a null parentSpanId and is the only one', () => {
    const rng = mulberry32(42);
    const trace = buildTrace(rng, entryOperations[0], 1000);

    for (let i = 0; i < trace.length; i++) {
      if (i === 0) {
        expect(trace[0].parentSpanId).toBe(null);
      } else {
        expect(trace[i].parentSpanId).not.toBe(null);
      }
    }
  });

  it('root starts in the startMs provided', () => {
    const rng = mulberry32(42);
    const trace = buildTrace(rng, entryOperations[0], 1000);

    expect(trace[0].startMs).toBe(1000);
  });
});
