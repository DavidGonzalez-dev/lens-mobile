import {
  buildRedPoints,
  getSpansByTrace,
  summarizeServiceRed,
  summarizeTraces,
  timeRangeToMs,
  type Page,
  type Pagination,
  type RedPoint,
  type ServiceRed,
  type Span,
  type TelemetryRepository,
  type TimeRange,
  type Trace,
  type TraceQuery,
} from '../../domain';

import { paginate } from './paginate';

/** Answers the telemetry contract from spans kept in memory. Used in the browser. */
export class InMemoryTelemetryRepository implements TelemetryRepository {
  private readonly redPoints: RedPoint[];
  private readonly spansByTrace: Map<string, Span[]>;
  /** Every trace, newest first (the order getTraces must return). */
  private readonly traces: Trace[];

  constructor(
    spans: Span[],
    private readonly nowMs: number,
  ) {
    this.redPoints = buildRedPoints(spans);
    this.spansByTrace = getSpansByTrace(spans);
    this.traces = summarizeTraces(spans);
  }

  async getServiceRed(range: TimeRange): Promise<ServiceRed[]> {
    return summarizeServiceRed(this.pointsInRange(range), timeRangeToMs(range));
  }

  async getRedSeries(service: string, range: TimeRange): Promise<RedPoint[]> {
    const pointsInRange = this.pointsInRange(range);
    return pointsInRange.filter((point) => point.service === service);
  }

  async getTraces(query: TraceQuery, pagination: Pagination): Promise<Page<Trace>> {
    const tracesMatching = this.traces.filter((trace) => this.matchesQuery(trace, query));
    return paginate(tracesMatching, pagination);
  }

  /**
   * True when the trace passes every filter the query sets. A filter left `undefined` lets every trace through.
   * - serviceName / operation: match ANY span of the trace (spansByTrace), not only the root.
   * - minDurationNs: trace lasts at least that long.
   * - hasError: trace.hasError equals it (so `false` means "only healthy traces").
   * - range: trace.startMs falls in [nowMs - range, nowMs), same window as pointsInRange.
   */
  private matchesQuery(trace: Trace, query: TraceQuery): boolean {
    const spans = this.spansByTrace.get(trace.traceId) ?? [];
    const rangeMs = query.range ? timeRangeToMs(query.range) : undefined;

    if (query.hasError !== undefined && trace.hasError !== query.hasError) {
      return false;
    }
    if (query.minDurationNs !== undefined && trace.durationNs < query.minDurationNs) {
      return false;
    }
    if (query.operation !== undefined && !spans.some((span) => span.name === query.operation)) {
      return false;
    }
    if (query.serviceName !== undefined && !spans.some((span) => span.service === query.serviceName)) {
      return false;
    }
    if (rangeMs !== undefined && (trace.startMs < this.nowMs - rangeMs || trace.startMs >= this.nowMs)) {
      return false;
    }

    return true;
  }

  async getSpansFromTrace(traceId: string): Promise<Span[]> {
    return this.spansByTrace.get(traceId) ?? [];
  }

  /** RED points whose minute falls in [nowMs - range, nowMs). */
  private pointsInRange(range: TimeRange): RedPoint[] {
    const startMs = this.nowMs - timeRangeToMs(range);

    return this.redPoints.filter((point) => point.minuteMs >= startMs && point.minuteMs < this.nowMs);
  }
}
