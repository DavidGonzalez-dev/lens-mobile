import { describe, expect, it } from 'vitest';

import { Aggregate, AlertStatus, type AlertRule, type AlertTransition } from '../../domain';

import { InMemoryAlertRepository } from './in-memory-alert-repository';

function makeRule(overrides: Partial<AlertRule>): AlertRule {
  return {
    id: 'rule-1',
    name: 'Checkout errors',
    service: 'checkout',
    aggregate: Aggregate.ERROR_RATE,
    threshold: 0.05,
    windowMin: 5,
    enabled: true,
    status: AlertStatus.OK,
    updatedAtMs: 0,
    ...overrides,
  };
}

function makeTransition(overrides: Partial<AlertTransition>): AlertTransition {
  return {
    id: 'transition-1',
    ruleId: 'rule-1',
    fromStatus: AlertStatus.OK,
    toStatus: AlertStatus.FIRING,
    value: 0.2,
    tsMs: 1_000,
    ...overrides,
  };
}

async function ruleIds(repository: InMemoryAlertRepository, service?: string): Promise<string[]> {
  return (await repository.getAlertRules(service)).map((rule) => rule.id);
}

describe('InMemoryAlertRepository', () => {
  describe('rules', () => {
    it('starts with the initial rules, sorted by name', async () => {
      const repository = new InMemoryAlertRepository([
        makeRule({ id: 'b', name: 'Payment latency' }),
        makeRule({ id: 'a', name: 'Checkout errors' }),
      ]);

      expect(await ruleIds(repository)).toEqual(['a', 'b']);
    });

    it('starts empty when no initial rules are given', async () => {
      expect(await new InMemoryAlertRepository().getAlertRules()).toEqual([]);
    });

    it('filters rules by service', async () => {
      const repository = new InMemoryAlertRepository([
        makeRule({ id: 'a', service: 'checkout' }),
        makeRule({ id: 'b', service: 'payment' }),
      ]);

      expect(await ruleIds(repository, 'payment')).toEqual(['b']);
    });

    it('creates a rule', async () => {
      const repository = new InMemoryAlertRepository();

      await repository.createAlertRule(makeRule({ id: 'a' }));

      expect(await ruleIds(repository)).toEqual(['a']);
    });

    it('keeps rules sorted by name after creating one', async () => {
      const repository = new InMemoryAlertRepository([makeRule({ id: 'b', name: 'Payment latency' })]);

      await repository.createAlertRule(makeRule({ id: 'a', name: 'Checkout errors' }));

      expect(await ruleIds(repository)).toEqual(['a', 'b']);
    });

    it('rejects a rule whose id already exists', async () => {
      const repository = new InMemoryAlertRepository([makeRule({ id: 'a' })]);

      await expect(repository.createAlertRule(makeRule({ id: 'a' }))).rejects.toThrow();
    });

    it('updates a rule', async () => {
      const repository = new InMemoryAlertRepository([makeRule({ id: 'a', threshold: 0.05 })]);

      await repository.updateAlertRule(makeRule({ id: 'a', threshold: 0.1 }));

      const [rule] = await repository.getAlertRules();
      expect(rule.threshold).toBe(0.1);
    });

    it('rejects updating a rule that does not exist', async () => {
      const repository = new InMemoryAlertRepository();

      await expect(repository.updateAlertRule(makeRule({ id: 'missing' }))).rejects.toThrow();
    });

    it('deletes a rule, and ignores an unknown id', async () => {
      const repository = new InMemoryAlertRepository([makeRule({ id: 'a' }), makeRule({ id: 'b' })]);

      await repository.deleteAlertRule('a');
      await repository.deleteAlertRule('missing');

      expect(await ruleIds(repository)).toEqual(['b']);
    });

    it('does not let a caller change stored rules by editing returned objects', async () => {
      const original = makeRule({ id: 'a', threshold: 0.05 });
      const repository = new InMemoryAlertRepository([original]);

      original.threshold = 99;
      const [returned] = await repository.getAlertRules();
      returned.threshold = 99;

      const [stored] = await repository.getAlertRules();
      expect(stored.threshold).toBe(0.05);
    });
  });

  describe('history', () => {
    it('returns transitions newest first', async () => {
      const repository = new InMemoryAlertRepository();

      await repository.addAlertTransition(makeTransition({ id: 'old', tsMs: 1_000 }));
      await repository.addAlertTransition(makeTransition({ id: 'new', tsMs: 3_000 }));
      await repository.addAlertTransition(makeTransition({ id: 'mid', tsMs: 2_000 }));

      const history = await repository.getAlertHistory();

      expect(history.map((transition) => transition.id)).toEqual(['new', 'mid', 'old']);
    });

    it('does not let a caller change stored transitions by editing returned objects', async () => {
      const original = makeTransition({ value: 0.2 });
      const repository = new InMemoryAlertRepository();
      await repository.addAlertTransition(original);

      original.value = 99;
      const [returned] = await repository.getAlertHistory();
      returned.value = 99;

      const [stored] = await repository.getAlertHistory();
      expect(stored.value).toBe(0.2);
    });

    it('keeps the history of a deleted rule', async () => {
      const repository = new InMemoryAlertRepository([makeRule({ id: 'rule-1' })]);
      await repository.addAlertTransition(makeTransition({ ruleId: 'rule-1' }));

      await repository.deleteAlertRule('rule-1');

      expect(await repository.getAlertHistory()).toHaveLength(1);
    });
  });
});
