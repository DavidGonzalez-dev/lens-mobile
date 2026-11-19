import type { RedPoint } from '../entities/red-point';
import type { ServiceRed } from '../entities/service-red';
import type { Span } from '../entities/span';
import type { TimeRange } from '../entities/time-range';
import type { Trace } from '../entities/trace';

import type { Page, Pagination } from './pagination';

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
