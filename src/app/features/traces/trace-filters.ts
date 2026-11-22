import type { TimeRange, TraceQuery } from '../../telemetry/domain';

const NS_PER_MS = 1_000_000;

/** What the user typed or picked in the trace search form, before it becomes a query. */
export interface TraceFilters {
  /** '' means any service. */
  service: string;
  /** Free text; '' or only spaces means any operation. */
  operation: string;
  status: 'all' | 'error' | 'ok';
  /** In milliseconds, as typed. null means no minimum. */
  minDurationMs: number | null;
  range: TimeRange | 'all';
}

export const DEFAULT_TRACE_FILTERS: TraceFilters = {
  service: '',
  operation: '',
  status: 'all',
  minDurationMs: null,
  range: '15m',
};

/**
 * Translates the form into the repository's TraceQuery. A filter the user left empty must
 * NOT appear in the query (leave it undefined), otherwise it would filter everything out.
 * - service:       '' → no filter.
 * - operation:     trimmed; empty after trimming → no filter.
 * - status:        'all' → no filter, 'error' → hasError true, 'ok' → hasError false.
 * - minDurationMs: null → no filter; otherwise converted to nanoseconds (minDurationNs).
 * - range:         'all' → no filter.
 */
export function toTraceQuery(filters: TraceFilters): TraceQuery {
  const query: TraceQuery = {};
  const operation = filters.operation.trim();

  if (filters.service !== '') {
    query.serviceName = filters.service;
  }
  if (operation !== '') {
    query.operation = operation;
  }
  if (filters.minDurationMs !== null) {
    query.minDurationNs = filters.minDurationMs * NS_PER_MS;
  }
  if (filters.status !== 'all') {
    query.hasError = filters.status === 'error';
  }
  if (filters.range !== 'all') {
    query.range = filters.range;
  }

  return query;
}
