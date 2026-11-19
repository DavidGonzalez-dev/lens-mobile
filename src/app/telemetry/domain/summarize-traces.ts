import { SpanStatusCode, type Span } from './span';
import type { Trace } from './trace';

export function summarizeTraces(spans: Span[]): Trace[] {
  const spansByTrace = getSpansByTrace(spans);

  const traces: Trace[] = [];

  for (const [traceId, traceSpans] of spansByTrace) {
    const root = traceSpans.find((span) => span.parentSpanId === null);
    if (!root) {
      continue;
    }

    const trace: Trace = {
      traceId,
      rootService: root.service,
      rootName: root.name,
      startMs: root.startMs,
      durationNs: root.durationNs,
      spanCount: traceSpans.length,
      hasError: traceSpans.some((span) => span.statusCode === SpanStatusCode.ERROR),
    };

    traces.push(trace);
  }

  return traces.sort((a, b) => b.startMs - a.startMs || a.traceId.localeCompare(b.traceId));
}

function getSpansByTrace(spans: Span[]): Map<string, Span[]> {
  const spansByTrace = new Map<string, Span[]>();

  for (const span of spans) {
    const list = spansByTrace.get(span.traceId);

    if (list === undefined) {
      spansByTrace.set(span.traceId, [span]);
      continue;
    }

    list.push(span);
  }

  return spansByTrace;
}
