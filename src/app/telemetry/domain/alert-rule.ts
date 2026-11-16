export enum Aggregate {
  ERROR_RATE = 'error_rate',
  P99 = 'p99',
  RPS = 'rps',
}

export enum AlertStatus {
  OK = 'ok',
  FIRING = 'firing',
}

export interface AlertRule {
  id: string;
  name: string;
  service: string;
  aggregate: Aggregate;
  /** Unit depends on `aggregate`: ratio 0–1 for ERROR_RATE, nanoseconds for P99, requests/s for RPS. */
  threshold: number;
  windowMin: number;
  enabled: boolean;
  status: AlertStatus;
  updatedAtMs: number;
}
