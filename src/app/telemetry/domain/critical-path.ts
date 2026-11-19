import type { Span } from './span';

export function criticalPath(spans: Span[]): string[] {
  const root = spans.find((span) => span.parentSpanId === null);
  if (root === undefined) {
    return [];
  }

  const resultList: string[] = [];

  walk(root, spans, resultList);

  return resultList;
}

// This function finds the critical spans of a span list and writes them into a given string list
function walk(parent: Span, spans: Span[], result: string[]): void {
  result.push(parent.spanId);

  let explainedUntilMs = getEndMs(parent);

  const children = spans
    .filter((span) => span.parentSpanId === parent.spanId)
    .sort((a, b) => getEndMs(b) - getEndMs(a));

  for (const child of children) {
    if (getEndMs(child) <= explainedUntilMs) {
      walk(child, spans, result);
      explainedUntilMs = child.startMs;
    }
  }
}

function getEndMs(span: Span): number {
  return span.startMs + span.durationNs / 1_000_000;
}
