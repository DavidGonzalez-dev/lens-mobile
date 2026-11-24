import { describe, expect, it } from 'vitest';

import { Aggregate, AlertStatus, type AlertRule } from '../../telemetry/domain';

import {
  EMPTY_RULE_FORM,
  formatAlertValue,
  toAlertRule,
  toRuleForm,
  validateRuleForm,
  type AlertRuleForm,
} from './alert-rule-form';

const SERVICES = ['checkout', 'payment'];
const VALID: AlertRuleForm = {
  name: 'Payment errors',
  service: 'payment',
  aggregate: Aggregate.ERROR_RATE,
  threshold: 10,
  windowMin: 5,
  enabled: true,
};

describe('validateRuleForm', () => {
  it('accepts a valid form', () => {
    expect(validateRuleForm(VALID, SERVICES)).toEqual({});
  });

  it('flags every empty field of a blank form', () => {
    const errors = validateRuleForm({ ...EMPTY_RULE_FORM, windowMin: null }, SERVICES);

    expect(Object.keys(errors).sort()).toEqual(['name', 'service', 'threshold', 'windowMin']);
  });

  it('rejects a name made only of spaces', () => {
    expect(validateRuleForm({ ...VALID, name: '   ' }, SERVICES).name).toBeDefined();
  });

  it('rejects a service that does not exist', () => {
    expect(validateRuleForm({ ...VALID, service: 'ghost' }, SERVICES).service).toBeDefined();
  });

  it('rejects thresholds of 0 or less, and percentages over 100', () => {
    expect(validateRuleForm({ ...VALID, threshold: 0 }, SERVICES).threshold).toBeDefined();
    expect(validateRuleForm({ ...VALID, threshold: 101 }, SERVICES).threshold).toBeDefined();
    expect(validateRuleForm({ ...VALID, aggregate: Aggregate.P99, threshold: 101 }, SERVICES)).toEqual({});
  });

  it('accepts only whole windows between 1 and 60 minutes', () => {
    expect(validateRuleForm({ ...VALID, windowMin: 0 }, SERVICES).windowMin).toBeDefined();
    expect(validateRuleForm({ ...VALID, windowMin: 61 }, SERVICES).windowMin).toBeDefined();
    expect(validateRuleForm({ ...VALID, windowMin: 2.5 }, SERVICES).windowMin).toBeDefined();
    expect(validateRuleForm({ ...VALID, windowMin: 60 }, SERVICES)).toEqual({});
  });
});

describe('toAlertRule / toRuleForm', () => {
  it('stores the threshold in the domain unit', () => {
    expect(toAlertRule(VALID, 'r1', 0).threshold).toBe(0.1);
    expect(toAlertRule({ ...VALID, aggregate: Aggregate.P99, threshold: 500 }, 'r1', 0).threshold).toBe(500_000_000);
  });

  it('starts a new rule OK and keeps the status of an edited one', () => {
    expect(toAlertRule(VALID, 'r1', 0).status).toBe(AlertStatus.OK);

    const existing = { ...toAlertRule(VALID, 'r1', 0), status: AlertStatus.FIRING };
    expect(toAlertRule(VALID, 'r1', 5, existing).status).toBe(AlertStatus.FIRING);
  });

  it('goes back to the same form it came from', () => {
    const rule: AlertRule = toAlertRule({ ...VALID, name: '  Payment errors  ' }, 'r1', 0);

    expect(toRuleForm(rule)).toEqual(VALID);
  });
});

describe('formatAlertValue', () => {
  it('shows each aggregate in its screen unit', () => {
    expect(formatAlertValue(Aggregate.ERROR_RATE, 0.0523)).toBe('5.2 %');
    expect(formatAlertValue(Aggregate.P99, 512_000_000)).toBe('512 ms');
    expect(formatAlertValue(Aggregate.RPS, 3.5)).toBe('3.50 req/s');
  });
});
