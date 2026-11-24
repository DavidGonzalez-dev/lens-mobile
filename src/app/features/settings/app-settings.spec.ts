import { describe, expect, it } from 'vitest';

import { DEFAULT_SETTINGS, parseSettings, shouldUseDark } from './app-settings';

describe('parseSettings', () => {
  it('uses the defaults when nothing was saved', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it('reads valid saved settings', () => {
    expect(parseSettings('{"theme":"dark","scenario":"n-plus-one"}')).toEqual({
      theme: 'dark',
      scenario: 'n-plus-one',
    });
  });

  it('falls back to the defaults for broken JSON or a non-object', () => {
    expect(parseSettings('{oops')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('null')).toEqual(DEFAULT_SETTINGS);
  });

  it('replaces only the unknown values', () => {
    expect(parseSettings('{"theme":"neon","scenario":"retry-storm"}')).toEqual({
      theme: DEFAULT_SETTINGS.theme,
      scenario: 'retry-storm',
    });
  });
});

describe('shouldUseDark', () => {
  it('follows the phone only on system', () => {
    expect(shouldUseDark('system', true)).toBe(true);
    expect(shouldUseDark('system', false)).toBe(false);
    expect(shouldUseDark('dark', false)).toBe(true);
    expect(shouldUseDark('light', true)).toBe(false);
  });
});
