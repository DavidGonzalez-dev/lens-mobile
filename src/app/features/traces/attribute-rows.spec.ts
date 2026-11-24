import { describe, expect, it } from 'vitest';

import { toAttributeRows } from './attribute-rows';

describe('toAttributeRows', () => {
  it('sorts the rows by key', () => {
    const rows = toAttributeRows({ 'http.route': '/orders', 'db.system': 'postgresql', 'http.method': 'POST' });

    expect(rows.map((row) => row.key)).toEqual(['db.system', 'http.method', 'http.route']);
  });

  it('turns numbers and booleans into text', () => {
    expect(toAttributeRows({ 'http.status_code': 503, retried: true })).toEqual([
      { key: 'http.status_code', value: '503' },
      { key: 'retried', value: 'true' },
    ]);
  });

  it('returns no rows for no attributes', () => {
    expect(toAttributeRows({})).toEqual([]);
  });
});
