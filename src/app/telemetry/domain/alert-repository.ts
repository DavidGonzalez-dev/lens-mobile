import type { AlertRule } from './alert-rule';
import type { AlertTransition } from './alert-transition';

export interface AlertRepository {
  getAlertRules(service?: AlertRule['service']): Promise<AlertRule[]>;
  createAlertRule(rule: AlertRule): Promise<void>;
  updateAlertRule(rule: AlertRule): Promise<void>;
  deleteAlertRule(id: string): Promise<void>;

  addAlertTransition(transition: AlertTransition): Promise<void>;
  getAlertHistory(): Promise<AlertTransition[]>;
}
