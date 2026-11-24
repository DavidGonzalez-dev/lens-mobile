import type { AttributeValue } from '../../telemetry/domain';

/** One line of the attributes table: the key and its value already turned into text. */
export interface AttributeRow {
  key: string;
  value: string;
}

/**
 * Turns a span's (or event's) attributes into rows sorted by key, A→Z, so the same span
 * always shows its attributes in the same order. Every value becomes text with String().
 *   { 'http.route': '/orders', 'db.rows': 3 } → [{ key: 'db.rows', value: '3' }, { key: 'http.route', value: '/orders' }]
 */
export function toAttributeRows(attributes: Record<string, AttributeValue>): AttributeRow[] {
  return Object.entries(attributes)
    .map(([key, value]) => ({ key, value: String(value) }))
    .sort((a, b) => a.key.localeCompare(b.key));
}
