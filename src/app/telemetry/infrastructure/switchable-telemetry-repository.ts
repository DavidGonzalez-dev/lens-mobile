import type {
  Page,
  Pagination,
  RedPoint,
  ServiceRed,
  Span,
  TelemetryRepository,
  TimeRange,
  Trace,
  TraceQuery,
} from '../domain';

/**
 * A TelemetryRepository that forwards every call to another one, which can be swapped at any
 * time. Screens keep the same object (the one Angular injected) while the data behind it
 * changes, e.g. when Settings loads another demo scenario.
 */
export class SwitchableTelemetryRepository implements TelemetryRepository {
  constructor(private current: TelemetryRepository) {}

  replace(next: TelemetryRepository): void {
    this.current = next;
  }

  getServiceRed(range: TimeRange): Promise<ServiceRed[]> {
    return this.current.getServiceRed(range);
  }

  getRedSeries(service: string, range: TimeRange): Promise<RedPoint[]> {
    return this.current.getRedSeries(service, range);
  }

  getTraces(query: TraceQuery, pagination: Pagination): Promise<Page<Trace>> {
    return this.current.getTraces(query, pagination);
  }

  getSpansFromTrace(traceId: string): Promise<Span[]> {
    return this.current.getSpansFromTrace(traceId);
  }
}
