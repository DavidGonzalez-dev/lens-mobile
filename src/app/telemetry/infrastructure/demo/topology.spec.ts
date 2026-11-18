import { it, describe, expect } from 'vitest';

import type { TopologyNode } from './topology';
import { entryOperations } from './topology';

describe('topology', () => {
  it('has valid latency range in every node', () => {
    for (const operation of entryOperations) {
      const result = checkLatency(operation);
      expect(result).toBe(true);
    }
  });
});

function checkLatency(node: TopologyNode): boolean {
  if (node.latencyMs.min > node.latencyMs.max) {
    return false;
  }

  for (const child of node.children) {
    const passes = checkLatency(child);
    if (!passes) {
      return false;
    }
  }

  return true;
}
