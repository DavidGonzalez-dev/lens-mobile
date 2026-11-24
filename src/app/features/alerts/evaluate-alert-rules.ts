import {
  detectTransition,
  evaluateRule,
  type AlertRepository,
  type AlertRule,
  type TelemetryRepository,
  type TimeRange,
} from '../../telemetry/domain';

/** A rule after evaluation, with the value it was compared against its threshold. */
export interface EvaluatedRule {
  rule: AlertRule;
  value: number;
}

/** Smallest range that covers the rule's window, so fewer points are loaded. */
export function rangeForWindow(windowMin: number): TimeRange {
  if (windowMin <= 15) {
    return '15m';
  }
  return windowMin <= 60 ? '1h' : '24h';
}

/**
 * Evaluates every rule against the latest metrics. A rule whose status changed is saved with
 * the new status and leaves a transition in the history (RF-09). Returns every rule with its value.
 */
export async function evaluateAlertRules(
  alerts: AlertRepository,
  telemetry: TelemetryRepository,
  nowMs: number,
): Promise<EvaluatedRule[]> {
  const rules = await alerts.getAlertRules();
  const evaluated: EvaluatedRule[] = [];

  for (const rule of rules) {
    const points = await telemetry.getRedSeries(rule.service, rangeForWindow(rule.windowMin));
    const evaluation = evaluateRule(rule, points, nowMs);
    const transition = detectTransition(rule, evaluation, nowMs);

    if (transition === null) {
      evaluated.push({ rule, value: evaluation.value });
      continue;
    }

    const updated: AlertRule = { ...rule, status: evaluation.status, updatedAtMs: nowMs };
    await alerts.addAlertTransition(transition);
    await alerts.updateAlertRule(updated);
    evaluated.push({ rule: updated, value: evaluation.value });
  }

  return evaluated;
}
