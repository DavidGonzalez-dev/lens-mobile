import { describe, expect, it } from 'vitest';

import { DEFAULT_TRACE_FILTERS, toTraceQuery, type TraceFilters } from './trace-filters';

const NO_FILTERS: TraceFilters = { ...DEFAULT_TRACE_FILTERS, range: 'all' };

function query(overrides: Partial<TraceFilters>) {
  return toTraceQuery({ ...NO_FILTERS, ...overrides });
}

describe('toTraceQuery', () => {
  it('returns an empty query when nothing is filtered', () => {
    expect(toTraceQuery(NO_FILTERS)).toEqual({});
  });

  it('filters by service', () => {
    expect(query({ service: 'payment' })).toEqual({ serviceName: 'payment' });
  });

  it('trims the operation and ignores one made only of spaces', () => {
    expect(query({ operation: '  charge card ' })).toEqual({ operation: 'charge card' });
    expect(query({ operation: '   ' })).toEqual({});
  });

  it('maps the status to hasError', () => {
    expect(query({ status: 'error' })).toEqual({ hasError: true });
    expect(query({ status: 'ok' })).toEqual({ hasError: false });
  });

  it('converts the minimum duration from milliseconds to nanoseconds', () => {
    expect(query({ minDurationMs: 250 })).toEqual({ minDurationNs: 250_000_000 });
  });

  it('keeps a minimum duration of 0', () => {
    expect(query({ minDurationMs: 0 })).toEqual({ minDurationNs: 0 });
  });

  it('filters by range unless it is "all"', () => {
    expect(query({ range: '1h' })).toEqual({ range: '1h' });
  });

  it('combines every filter', () => {
    expect(
      toTraceQuery({
        service: 'checkout',
        operation: 'POST /orders',
        status: 'error',
        minDurationMs: 100,
        range: '15m',
      }),
    ).toEqual({
      serviceName: 'checkout',
      operation: 'POST /orders',
      hasError: true,
      minDurationNs: 100_000_000,
      range: '15m',
    });
  });
});
