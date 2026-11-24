import { describe, expect, it } from 'vitest';

import { truncate } from './truncate';

describe('truncate', () => {
  it('leaves a short text unchanged', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('leaves a text of exactly max characters unchanged', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('cuts a long text and adds an ellipsis', () => {
    expect(truncate('hello world', 5)).toBe('hello…');
  });

  it('uses 120 characters by default', () => {
    expect(truncate('a'.repeat(121))).toBe('a'.repeat(120) + '…');
  });
});
