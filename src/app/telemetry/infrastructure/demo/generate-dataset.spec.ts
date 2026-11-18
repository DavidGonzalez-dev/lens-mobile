import { describe, expect, it } from 'vitest';

import { DAY_MS, generateDataset } from './generate-dataset';

describe('generateDataSet', () => {
  it('same seed creates same data set', () => {
    const dataSet1 = generateDataset(42, 1000);
    const dataSet2 = generateDataset(42, 1000);

    expect(dataSet1).toEqual(dataSet2);
  });

  it('correct amount of roots', () => {
    const target = 5760;

    const dataSet = generateDataset(42, 1000);
    const roots = dataSet.filter((span) => span.parentSpanId === null);

    expect(roots.length).toBe(target);
  });

  it('all roots begin between nowMs - 24h and nowMs', () => {
    const NOW_MS = 1_763_400_000_000;
    const dataSet = generateDataset(42, NOW_MS);
    const roots = dataSet.filter((span) => span.parentSpanId === null);

    for (const root of roots) {
      expect(root.startMs).toBeGreaterThanOrEqual(NOW_MS - DAY_MS);
      expect(root.startMs).toBeLessThanOrEqual(NOW_MS);
    }
  });
});
