import { describe, expect, it } from 'vitest';

import { between, mulberry32, pick, randomHex } from './random';

describe('mulberry32', () => {
  it('produces the same sequence for the same seed', () => {
    const first = mulberry32(42);
    const second = mulberry32(42);

    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });

  it('produces a different sequence for a different seed', () => {
    const first = mulberry32(42);
    const second = mulberry32(7);

    expect(first()).not.toBe(second());
  });

  it('always returns a value in the range [0, 1)', () => {
    const rng = mulberry32(1234);

    for (let i = 0; i < 1000; i++) {
      const value = rng();

      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('returns the expected values for a known seed', () => {
    const rng = mulberry32(42);

    expect(rng()).toBe(0.6011037519201636);
    expect(rng()).toBe(0.44829055899754167);
    expect(rng()).toBe(0.8524657934904099);
  });
});

describe('pick', () => {
  it('returns the first element when the rng yields 0', () => {
    expect(pick(() => 0, ['a', 'b', 'c'])).toBe('a');
  });

  it('returns the last element when the rng yields a value just below 1', () => {
    expect(pick(() => 0.999, ['a', 'b', 'c'])).toBe('c');
  });

  it('returns an element that belongs to the given list', () => {
    const list = ['a', 'b', 'c'];
    const rng = mulberry32(42);

    for (let i = 0; i < 1000; i++) {
      expect(list).toContain(pick(rng, list));
    }
  });

  it('returns the expected elements for a known seed', () => {
    const rng = mulberry32(42);

    expect(pick(rng, ['a', 'b', 'c'])).toBe('b');
    expect(pick(rng, ['a', 'b', 'c'])).toBe('b');
    expect(pick(rng, ['a', 'b', 'c'])).toBe('c');
  });

  it('throws when the list is empty', () => {
    expect(() => pick(mulberry32(42), [])).toThrow('pick: cannot pick from an empty list');
  });
});

describe('between', () => {
  it('returns the lower bound when the rng yields 0', () => {
    expect(between(() => 0, 1, 6)).toBe(1);
  });

  it('returns the upper bound when the rng yields a value just below 1', () => {
    expect(between(() => 0.999, 1, 6)).toBe(6);
  });

  it('always returns an integer within the inclusive range', () => {
    const rng = mulberry32(42);

    for (let i = 0; i < 1000; i++) {
      const value = between(rng, 1, 6);

      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
    }
  });

  it('supports ranges that include negative numbers', () => {
    const rng = mulberry32(42);

    for (let i = 0; i < 1000; i++) {
      const value = between(rng, -5, 5);

      expect(value).toBeGreaterThanOrEqual(-5);
      expect(value).toBeLessThanOrEqual(5);
    }
  });

  it('returns the only possible value when min equals max', () => {
    expect(between(() => 0, 7, 7)).toBe(7);
    expect(between(() => 0.5, 7, 7)).toBe(7);
    expect(between(() => 0.999, 7, 7)).toBe(7);
  });

  it('returns the expected values for a known seed', () => {
    const rng = mulberry32(42);

    expect(between(rng, 1, 6)).toBe(4);
    expect(between(rng, 1, 6)).toBe(3);
    expect(between(rng, 1, 6)).toBe(6);
    expect(between(rng, 1, 6)).toBe(5);
    expect(between(rng, 1, 6)).toBe(2);
  });
});

describe('randomHex', () => {
  it('has the exact lenght required', () => {
    const rng = mulberry32(42);

    const first = randomHex(rng, 16);
    const second = randomHex(rng, 32);

    expect(first.length).toEqual(16);
    expect(second.length).toEqual(32);
  });

  it('contains only hex characters', () => {
    const rng = mulberry32(42);
    expect(randomHex(rng, 32)).toMatch(/^[0-9a-f]+$/);
  });

  it('gives the same id with the same seed', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);

    const first = randomHex(rng1, 32);
    const second = randomHex(rng2, 32);

    expect(first).toEqual(second);
  });
});
