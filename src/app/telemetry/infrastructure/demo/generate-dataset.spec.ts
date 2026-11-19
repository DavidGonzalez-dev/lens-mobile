import { describe, expect, it } from 'vitest';

import { SpanStatusCode, type Span } from '../../domain';

import { DAY_MS, generateDataset, INCIDENT_WINDOW_MS } from './generate-dataset';

const NOW_MS = 1_763_400_000_000;
const INCIDENT_START_MS = NOW_MS - INCIDENT_WINDOW_MS;

/** Splits the spans by whether their trace's root started inside the incident window. */
function splitByIncident(dataSet: Span[]): { before: Span[]; during: Span[] } {
  const incidentTraceIds = new Set(
    dataSet
      .filter((span) => span.parentSpanId === null && span.startMs >= INCIDENT_START_MS)
      .map((span) => span.traceId),
  );

  return {
    before: dataSet.filter((span) => !incidentTraceIds.has(span.traceId)),
    during: dataSet.filter((span) => incidentTraceIds.has(span.traceId)),
  };
}

function countPerTrace(spans: Span[], name: string): number[] {
  const counts = new Map<string, number>();
  for (const span of spans) {
    if (span.name === name) {
      counts.set(span.traceId, (counts.get(span.traceId) ?? 0) + 1);
    }
  }
  return [...counts.values()];
}

describe('generateDataSet', () => {
  it('same seed creates same data set', () => {
    const dataSet1 = generateDataset(42, NOW_MS);
    const dataSet2 = generateDataset(42, NOW_MS);

    expect(dataSet1).toEqual(dataSet2);
  });

  it('correct amount of roots', () => {
    const target = 5760;

    const dataSet = generateDataset(42, NOW_MS);
    const roots = dataSet.filter((span) => span.parentSpanId === null);

    expect(roots.length).toBe(target);
  });

  it('all roots begin between nowMs - 24h and nowMs', () => {
    const dataSet = generateDataset(42, NOW_MS);
    const roots = dataSet.filter((span) => span.parentSpanId === null);

    for (const root of roots) {
      expect(root.startMs).toBeGreaterThanOrEqual(NOW_MS - DAY_MS);
      expect(root.startMs).toBeLessThanOrEqual(NOW_MS);
    }
  });

  it('a healthy day has no errors', () => {
    const dataSet = generateDataset(42, NOW_MS);

    expect(dataSet.every((span) => span.statusCode === SpanStatusCode.OK)).toBe(true);
  });

  describe('incident scenarios', () => {
    it('do not change the traffic before the incident window', () => {
      const healthy = splitByIncident(generateDataset(42, NOW_MS));
      const incident = splitByIncident(generateDataset(42, NOW_MS, 'retry-storm'));

      expect(incident.before).toEqual(healthy.before);
    });

    it('db-latency slows every database query during the incident only', () => {
      const { before, during } = splitByIncident(generateDataset(42, NOW_MS, 'db-latency'));
      const isQuery = (span: Span) => span.name.startsWith('SELECT');

      expect(during.filter(isQuery).every((span) => span.durationNs >= 80_000_000)).toBe(true);
      expect(before.filter(isQuery).every((span) => span.durationNs <= 10_000_000)).toBe(true);
    });

    it('dependency-503 makes charge card fail during the incident only', () => {
      const { before, during } = splitByIncident(generateDataset(42, NOW_MS, 'dependency-503'));
      const failed = during.filter((span) => span.statusCode === SpanStatusCode.ERROR);

      expect(failed.length).toBeGreaterThan(0);
      expect(failed.every((span) => span.name === 'charge card')).toBe(true);
      expect(failed.every((span) => span.attributes['http.response.status_code'] === 503)).toBe(true);
      expect(before.every((span) => span.statusCode === SpanStatusCode.OK)).toBe(true);
    });

    it('n-plus-one runs 25 stock queries per checkout during the incident', () => {
      const { before, during } = splitByIncident(generateDataset(42, NOW_MS, 'n-plus-one'));

      expect(countPerTrace(during, 'SELECT stock').every((count) => count === 25)).toBe(true);
      expect(countPerTrace(before, 'SELECT stock').every((count) => count === 1)).toBe(true);
    });

    it('retry-storm calls charge card 5 times per checkout during the incident', () => {
      const { before, during } = splitByIncident(generateDataset(42, NOW_MS, 'retry-storm'));

      expect(countPerTrace(during, 'charge card').every((count) => count === 5)).toBe(true);
      expect(countPerTrace(before, 'charge card').every((count) => count === 1)).toBe(true);
    });
  });
});
