import type { AlertRule } from '../entities/alert-rule';
import type { AlertTransition } from '../entities/alert-transition';

import type { RuleEvaluation } from './evaluate-rule';

/**
 * Compares the status a rule HAD with the one it was just evaluated to. Same status → null
 * (nothing happened). Different → the transition to store in the history (RF-09).
 * OK → FIRING is "fired"; FIRING → OK is "resolved".
 */
export function detectTransition(rule: AlertRule, evaluation: RuleEvaluation, nowMs: number): AlertTransition | null {
  if (evaluation.status === rule.status) {
    return null;
  }

  return {
    id: `${rule.id}@${nowMs}`,
    ruleId: rule.id,
    fromStatus: rule.status,
    toStatus: evaluation.status,
    value: evaluation.value,
    tsMs: nowMs,
  };
}
