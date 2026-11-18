import type { Span } from '../../domain';

import { buildTrace } from './build-trace';
import { between, mulberry32 } from './random';
import { checkoutOperation, productsOperation, type TopologyNode } from './topology';

export const MINUTES_IN_DAY = 24 * 60;
export const MINUTE_MS = 60 * 1000;
export const DAY_MS = MINUTES_IN_DAY * MINUTE_MS;

const TRACES_PER_MINUTE = 4;
const PRODUCTS_RATIO = 0.7;

export function generateDataset(seed: number, nowMs: number): Span[] {
  const dayStartMs = nowMs - DAY_MS;
  const rng = mulberry32(seed);
  const dataSet: Span[] = [];

  for (let minute = 0; minute < MINUTES_IN_DAY; minute++) {
    const minuteStart = dayStartMs + minute * MINUTE_MS;

    for (let trace = 0; trace < TRACES_PER_MINUTE; trace++) {
      const traceStartMs = minuteStart + between(rng, 0, 59_999);

      const rootTopologyNode = getRandomOperation(rng);
      const traceSpans = buildTrace(rng, rootTopologyNode, traceStartMs);

      dataSet.push(...traceSpans);
    }
  }

  return dataSet;
}

function getRandomOperation(rng: () => number): TopologyNode {
  return rng() < PRODUCTS_RATIO ? productsOperation : checkoutOperation;
}
