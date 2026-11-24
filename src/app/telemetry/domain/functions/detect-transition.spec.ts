import { describe, expect, it } from 'vitest';

import { Aggregate, AlertStatus, type AlertRule } from '../entities/alert-rule';

import { detectTransition } from './detect-transition';

const RULE: AlertRule = {
  id: 'r1',
  name: 'Payment errors',
  service: 'payment',
  aggregate: Aggregate.ERROR_RATE,
  threshold: 0.1,
  windowMin: 5,
  enabled: true,
  status: AlertStatus.OK,
  updatedAtMs: 0,
};

describe('detectTransition', () => {
  it('returns null when the status did not change', () => {
    expect(detectTransition(RULE, { status: AlertStatus.OK, value: 0.01 }, 1000)).toBeNull();
  });

  it('records OK → FIRING with the measured value', () => {
    expect(detectTransition(RULE, { status: AlertStatus.FIRING, value: 0.5 }, 1000)).toEqual({
      id: 'r1@1000',
      ruleId: 'r1',
      fromStatus: AlertStatus.OK,
      toStatus: AlertStatus.FIRING,
      value: 0.5,
      tsMs: 1000,
    });
  });

  it('records FIRING → OK (resolved)', () => {
    const firing = { ...RULE, status: AlertStatus.FIRING };
    const transition = detectTransition(firing, { status: AlertStatus.OK, value: 0.02 }, 2000);

    expect(transition?.fromStatus).toBe(AlertStatus.FIRING);
    expect(transition?.toStatus).toBe(AlertStatus.OK);
  });
});
