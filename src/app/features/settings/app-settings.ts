import { DEMO_SCENARIO } from '../../telemetry/infrastructure/create-repositories';
import type { ScenarioId } from '../../telemetry/infrastructure/demo/scenarios';

export type ThemePreference = 'light' | 'dark' | 'system';

/** What Settings remembers between launches. */
export interface AppSettings {
  theme: ThemePreference;
  scenario: ScenarioId;
}

export const DEFAULT_SETTINGS: AppSettings = { theme: 'system', scenario: DEMO_SCENARIO };

/** Name and one-line description of each demo incident, as Settings shows them. */
export const SCENARIO_OPTIONS: { id: ScenarioId; label: string; description: string }[] = [
  { id: 'db-latency', label: 'Database latency', description: 'Slow queries make every request slower.' },
  { id: 'dependency-503', label: 'Dependency 503', description: 'The payment service fails 60 % of the time.' },
  { id: 'n-plus-one', label: 'N+1 queries', description: 'Checkout queries stock once per item.' },
  { id: 'retry-storm', label: 'Retry storm', description: 'Failed payments are retried up to 5 times.' },
];

const THEMES: ThemePreference[] = ['light', 'dark', 'system'];

/**
 * Reads the saved settings. Anything missing, broken or unknown (a scenario that no longer
 * exists, hand-edited storage...) falls back to the default instead of breaking the app.
 */
export function parseSettings(raw: string | null): AppSettings {
  if (raw === null) {
    return DEFAULT_SETTINGS;
  }

  let saved: Partial<Record<keyof AppSettings, unknown>>;
  try {
    saved = JSON.parse(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }
  if (typeof saved !== 'object' || saved === null) {
    return DEFAULT_SETTINGS;
  }

  const theme = THEMES.find((option) => option === saved.theme) ?? DEFAULT_SETTINGS.theme;
  const scenario = SCENARIO_OPTIONS.find((option) => option.id === saved.scenario)?.id ?? DEFAULT_SETTINGS.scenario;
  return { theme, scenario };
}

/** 'system' follows the phone; 'light' and 'dark' ignore it. */
export function shouldUseDark(theme: ThemePreference, systemPrefersDark: boolean): boolean {
  return theme === 'system' ? systemPrefersDark : theme === 'dark';
}
