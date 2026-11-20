import type { AlertRepository, AlertRule, AlertTransition } from '../../domain';

/**
 * Answers the alert contract from rules and transitions kept in memory. Used in the browser.
 *
 * Every rule goes in and comes out as a COPY ({ ...rule }): a caller that edits a returned
 * object must not change what is stored, the same way editing a row read from SQLite does not
 * change the database until updateAlertRule is called.
 */
export class InMemoryAlertRepository implements AlertRepository {
  /** Rules by id. */
  private readonly rules = new Map<string, AlertRule>();
  private readonly transitions: AlertTransition[] = [];

  /** `initialRules` seeds the repository (the demo's default rules). */
  constructor(initialRules: AlertRule[] = []) {
    for (const rule of initialRules) {
      this.rules.set(rule.id, { ...rule });
    }
  }

  /** All rules, or only the ones of `service` when given. Sorted by name. */
  async getAlertRules(service?: string): Promise<AlertRule[]> {
    const rulesList = [...this.rules.values()]
      .map((rule) => ({ ...rule }))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (service !== undefined) {
      return rulesList.filter((rule) => rule.service === service);
    }

    return rulesList;
  }

  /** Throws if a rule with the same id already exists (like a duplicate primary key in SQLite). */
  async createAlertRule(rule: AlertRule): Promise<void> {
    if (this.rules.has(rule.id)) {
      throw new Error(`Alert rule ${rule.id} already exists`);
    }
    this.rules.set(rule.id, { ...rule });
  }

  /** Replaces the stored rule. Throws if no rule has that id. */
  async updateAlertRule(rule: AlertRule): Promise<void> {
    if (!this.rules.has(rule.id)) {
      throw new Error(`Alert rule ${rule.id} does not exist`);
    }
    this.rules.set(rule.id, { ...rule });
  }

  /** Removes the rule. Deleting an id that does not exist does nothing. History is kept. */
  async deleteAlertRule(id: string): Promise<void> {
    this.rules.delete(id);
  }

  async addAlertTransition(transition: AlertTransition): Promise<void> {
    this.transitions.push({ ...transition });
  }

  /** Every transition, newest first (tsMs descending). */
  async getAlertHistory(): Promise<AlertTransition[]> {
    return this.transitions.map((transition) => ({ ...transition })).sort((a, b) => b.tsMs - a.tsMs);
  }
}
