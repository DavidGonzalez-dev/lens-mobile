import type { RedPoint } from '../entities/red-point';
import { SpanKind, SpanStatusCode, type Span } from '../entities/span';

import { percentile } from './percentile';

export function buildRedPoints(spans: Span[]): RedPoint[] {
  const serverSpans = spans.filter((span) => span.kind === SpanKind.SERVER);
  const groups = groupSpans(serverSpans);

  const points: RedPoint[] = [];

  for (const minuteSpans of groups.values()) {
    const durationNsList = minuteSpans.map((span) => span.durationNs);

    const redPoint: RedPoint = {
      service: minuteSpans[0].service,
      name: minuteSpans[0].name,
      minuteMs: toMinuteMs(minuteSpans[0].startMs),
      requestCount: minuteSpans.length,
      errorCount: minuteSpans.filter((span) => span.statusCode === SpanStatusCode.ERROR).length,
      p50Ns: percentile(durationNsList, 50),
      p90Ns: percentile(durationNsList, 90),
      p99Ns: percentile(durationNsList, 99),
    };

    points.push(redPoint);
  }

  return points.sort(
    (a, b) => a.minuteMs - b.minuteMs || a.service.localeCompare(b.service) || a.name.localeCompare(b.name),
  );
}

function groupSpans(spans: Span[]): Map<string, Span[]> {
  const groups = new Map<string, Span[]>();

  for (const span of spans) {
    const minuteMs = toMinuteMs(span.startMs);
    const key = `${span.service}|${span.name}|${minuteMs}`;
    const list = groups.get(key);

    if (list === undefined) {
      groups.set(key, [span]);
      continue;
    }

    list.push(span);
  }

  return groups;
}

function toMinuteMs(startMs: number): number {
  return Math.floor(startMs / 60_000) * 60_000;
}
