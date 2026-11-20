import { Aggregate, AlertStatus, type AlertRule } from '../../domain';

const MS_TO_NS = 1_000_000;

/** Rules the demo starts with, so the alerts screens are not empty on first launch. */
export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'default-checkout-errors',
    name: 'Checkout error rate',
    service: 'checkout',
    aggregate: Aggregate.ERROR_RATE,
    threshold: 0.05,
    windowMin: 5,
    enabled: true,
    status: AlertStatus.OK,
    updatedAtMs: 0,
  },
  {
    id: 'default-payment-errors',
    name: 'Payment error rate',
    service: 'payment',
    aggregate: Aggregate.ERROR_RATE,
    threshold: 0.1,
    windowMin: 5,
    enabled: true,
    status: AlertStatus.OK,
    updatedAtMs: 0,
  },
  {
    id: 'default-frontend-latency',
    name: 'Frontend p99 latency',
    service: 'frontend',
    aggregate: Aggregate.P99,
    threshold: 500 * MS_TO_NS,
    windowMin: 5,
    enabled: true,
    status: AlertStatus.OK,
    updatedAtMs: 0,
  },
];
