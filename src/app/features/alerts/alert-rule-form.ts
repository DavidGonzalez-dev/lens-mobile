import { Aggregate, AlertStatus, type AlertRule } from '../../telemetry/domain';

const NS_PER_MS = 1_000_000;
export const NAME_MAX_LENGTH = 60;
export const WINDOW_MIN = 1;
export const WINDOW_MAX = 60;

/**
 * What the user types. The threshold is in the unit the screen shows, which is friendlier
 * than the stored one: percent for error rate, milliseconds for p99, requests/s for rps.
 * Numbers are null while the input is empty.
 */
export interface AlertRuleForm {
  name: string;
  service: string;
  aggregate: Aggregate;
  threshold: number | null;
  windowMin: number | null;
  enabled: boolean;
}

export type AlertRuleFormErrors = Partial<Record<keyof AlertRuleForm, string>>;

export const EMPTY_RULE_FORM: AlertRuleForm = {
  name: '',
  service: '',
  aggregate: Aggregate.ERROR_RATE,
  threshold: null,
  windowMin: 5,
  enabled: true,
};

/** Label of each aggregate, with the unit its threshold is typed in. */
export const AGGREGATE_LABELS: Record<Aggregate, string> = {
  [Aggregate.ERROR_RATE]: 'Error rate (%)',
  [Aggregate.P99]: 'p99 latency (ms)',
  [Aggregate.RPS]: 'Requests per second',
};

/** Every problem of the form, by field. An empty object means the form can be saved. */
export function validateRuleForm(form: AlertRuleForm, services: string[]): AlertRuleFormErrors {
  const errors: AlertRuleFormErrors = {};
  const name = form.name.trim();

  if (name === '') {
    errors.name = 'Name is required.';
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `At most ${NAME_MAX_LENGTH} characters.`;
  }

  if (!services.includes(form.service)) {
    errors.service = 'Pick a service.';
  }

  if (form.threshold === null || Number.isNaN(form.threshold)) {
    errors.threshold = 'Threshold is required.';
  } else if (form.threshold <= 0) {
    errors.threshold = 'Must be greater than 0.';
  } else if (form.aggregate === Aggregate.ERROR_RATE && form.threshold > 100) {
    errors.threshold = 'A percentage cannot exceed 100.';
  }

  if (
    form.windowMin === null ||
    !Number.isInteger(form.windowMin) ||
    form.windowMin < WINDOW_MIN ||
    form.windowMin > WINDOW_MAX
  ) {
    errors.windowMin = `Whole minutes between ${WINDOW_MIN} and ${WINDOW_MAX}.`;
  }

  return errors;
}

/** Screen unit → stored unit: 5 % → 0.05, 500 ms → 500_000_000 ns, rps unchanged. */
export function toStoredThreshold(aggregate: Aggregate, value: number): number {
  switch (aggregate) {
    case Aggregate.ERROR_RATE:
      return value / 100;
    case Aggregate.P99:
      return value * NS_PER_MS;
    case Aggregate.RPS:
      return value;
  }
}

/** Stored unit → screen unit, the inverse of toStoredThreshold. */
export function toFormThreshold(aggregate: Aggregate, value: number): number {
  switch (aggregate) {
    case Aggregate.ERROR_RATE:
      return value * 100;
    case Aggregate.P99:
      return value / NS_PER_MS;
    case Aggregate.RPS:
      return value;
  }
}

export function toRuleForm(rule: AlertRule): AlertRuleForm {
  return {
    name: rule.name,
    service: rule.service,
    aggregate: rule.aggregate,
    threshold: toFormThreshold(rule.aggregate, rule.threshold),
    windowMin: rule.windowMin,
    enabled: rule.enabled,
  };
}

/**
 * Builds the rule to store from a VALID form. `existing` keeps the id and status of the rule
 * being edited; without it the rule is new and starts OK.
 */
export function toAlertRule(form: AlertRuleForm, id: string, nowMs: number, existing?: AlertRule): AlertRule {
  return {
    id,
    name: form.name.trim(),
    service: form.service,
    aggregate: form.aggregate,
    threshold: toStoredThreshold(form.aggregate, form.threshold ?? 0),
    windowMin: form.windowMin ?? WINDOW_MIN,
    enabled: form.enabled,
    status: existing?.status ?? AlertStatus.OK,
    updatedAtMs: nowMs,
  };
}

/** A stored value as the user reads it: 0.0523 → "5.2 %", 512_000_000 → "512 ms", 3.5 → "3.50 req/s". */
export function formatAlertValue(aggregate: Aggregate, value: number): string {
  switch (aggregate) {
    case Aggregate.ERROR_RATE:
      return `${(value * 100).toFixed(1)} %`;
    case Aggregate.P99:
      return `${(value / NS_PER_MS).toFixed(0)} ms`;
    case Aggregate.RPS:
      return `${value.toFixed(2)} req/s`;
  }
}
