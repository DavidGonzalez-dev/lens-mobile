import type { Span } from '../../domain';

import { buildTrace } from './build-trace';
import { between, mulberry32 } from './random';
import { SCENARIOS, type ScenarioId } from './scenarios';
import {
  checkoutOperation,
  createCheckoutOperation,
  createProductsOperation,
  productsOperation,
  type TopologyNode,
} from './topology';

export const MINUTES_IN_DAY = 24 * 60;
export const MINUTE_MS = 60 * 1000;
export const DAY_MS = MINUTES_IN_DAY * MINUTE_MS;
/** The incident covers the last 15 minutes of the day. */
export const INCIDENT_WINDOW_MS = 15 * MINUTE_MS;

const TRACES_PER_MINUTE = 4;
const PRODUCTS_RATIO = 0.7;

interface Operations {
  checkout: TopologyNode;
  products: TopologyNode;
}

const HEALTHY_OPERATIONS: Operations = { checkout: checkoutOperation, products: productsOperation };

export function generateDataset(seed: number, nowMs: number, scenario?: ScenarioId): Span[] {
  const dayStartMs = nowMs - DAY_MS;
  const incidentStartMs = nowMs - INCIDENT_WINDOW_MS;
  const incidentOperations = scenario ? createOperations(scenario) : HEALTHY_OPERATIONS;
  const rng = mulberry32(seed);
  const dataSet: Span[] = [];

  for (let minute = 0; minute < MINUTES_IN_DAY; minute++) {
    const minuteStart = dayStartMs + minute * MINUTE_MS;

    for (let trace = 0; trace < TRACES_PER_MINUTE; trace++) {
      const traceStartMs = minuteStart + between(rng, 0, 59_999);

      const operations = traceStartMs >= incidentStartMs ? incidentOperations : HEALTHY_OPERATIONS;
      const rootTopologyNode = getRandomOperation(rng, operations);
      const traceSpans = buildTrace(rng, rootTopologyNode, traceStartMs);

      dataSet.push(...traceSpans);
    }
  }

  return dataSet;
}

function createOperations(scenario: ScenarioId): Operations {
  const conditions = SCENARIOS[scenario];
  return {
    checkout: createCheckoutOperation(conditions),
    products: createProductsOperation(conditions),
  };
}

function getRandomOperation(rng: () => number, operations: Operations): TopologyNode {
  return rng() < PRODUCTS_RATIO ? operations.products : operations.checkout;
}
