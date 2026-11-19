import { HEALTHY, type ErrorBehavior, type ShopConditions } from './topology';

export type ScenarioId = 'db-latency' | 'dependency-503' | 'n-plus-one' | 'retry-storm';

const PAYMENT_UNAVAILABLE: Omit<ErrorBehavior, 'rate'> = {
  message: '503 Service Unavailable',
  attributes: { 'http.response.status_code': 503 },
};

/** Shop conditions during each incident. Everything not overridden stays healthy. */
export const SCENARIOS: Record<ScenarioId, ShopConditions> = {
  'db-latency': { ...HEALTHY, dbLatencyMs: { min: 80, max: 200 } },
  'dependency-503': { ...HEALTHY, paymentError: { ...PAYMENT_UNAVAILABLE, rate: 0.6 } },
  'n-plus-one': { ...HEALTHY, stockQueries: 25 },
  'retry-storm': {
    ...HEALTHY,
    paymentAttempts: 5,
    paymentError: { ...PAYMENT_UNAVAILABLE, rate: 0.8 },
  },
};
