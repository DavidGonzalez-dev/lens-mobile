/** Texts longer than this are cut in the span detail until the user taps to expand them (RF-05). */
export const TRUNCATE_AT = 120;

/**
 * Cuts `text` to at most `max` characters, followed by "…" when something was removed.
 *   truncate('hello', 10)        → 'hello'      (fits, unchanged)
 *   truncate('hello world', 5)   → 'hello…'
 */
export function truncate(text: string, max: number = TRUNCATE_AT): string {
  if (text.length <= max) {
    return text;
  }
  return text.slice(0, max) + '…';
}
