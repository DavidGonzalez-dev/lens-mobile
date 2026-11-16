import type { Page, Pagination } from './pagination';
import type { RedPoint } from './red-point';
import type { ServiceRed } from './service-red';
import type { Span } from './span';
import type { Trace } from './trace';

export type TimeRange = '15m' | '1h' | '24h';

export interface TraceQuery {
  serviceName?: Trace['rootService'];
  minDurationNs?: Trace['durationNs'];
  hasError?: Trace['hasError'];
  range?: TimeRange;
  operation?: string;
}

export interface TelemetryRepository {
  getServiceRed(range: TimeRange): Promise<ServiceRed[]>;
  getRedSeries(service: RedPoint['service'], range: TimeRange): Promise<RedPoint[]>;

  /** Sorted by StartMs desc, ties broken by traceID*/
  getTraces(query: TraceQuery, pagination: Pagination): Promise<Page<Trace>>;
  getSpansFromTrace(traceId: string): Promise<Span[]>;
}
