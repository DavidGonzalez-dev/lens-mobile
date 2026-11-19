import type { AlertStatus } from './alert-rule';

export interface AlertTransition {
  id: string;
  ruleId: string;
  fromStatus: AlertStatus;
  toStatus: AlertStatus;
  /** Metric value that triggered the transition, in the rule's aggregate unit. */
  value: number;
  tsMs: number;
}
