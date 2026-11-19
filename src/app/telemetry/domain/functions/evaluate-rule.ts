import type { AlertRule } from '../entities/alert-rule';
import { AlertStatus, Aggregate } from '../entities/alert-rule';
import type { RedPoint } from '../entities/red-point';
import type { ServiceRed } from '../entities/service-red';

import { summarizeServiceRed } from './summarize-service-red';

export interface RuleEvaluation {
  value: number;
  status: AlertStatus;
}

export function evaluateRule(rule: AlertRule, points: RedPoint[], nowMs: number): RuleEvaluation {
  const windowMs = rule.windowMin * 60_000;
  const windowStartMs = nowMs - windowMs;

  const validPoints = points.filter(
    (point) => point.service === rule.service && point.minuteMs >= windowStartMs && point.minuteMs < nowMs,
  );
  const [summary] = summarizeServiceRed(validPoints, windowMs);
  if (summary === undefined) {
    return {
      value: 0,
      status: AlertStatus.OK,
    };
  }

  const value = pickValue(summary, rule.aggregate);
  const status = rule.enabled && value > rule.threshold ? AlertStatus.FIRING : AlertStatus.OK;

  return {
    value,
    status,
  };
}

function pickValue(summary: ServiceRed, aggregate: Aggregate): number {
  switch (aggregate) {
    case Aggregate.ERROR_RATE:
      return summary.errorRate;
    case Aggregate.P99:
      return summary.p99Ns;
    case Aggregate.RPS:
      return summary.rps;
  }
}
