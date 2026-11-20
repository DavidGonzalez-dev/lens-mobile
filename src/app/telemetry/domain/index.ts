// Entities
export type { AlertRule } from './entities/alert-rule';
export type { AlertTransition } from './entities/alert-transition';
export type { RedPoint } from './entities/red-point';
export type { ServiceRed } from './entities/service-red';
export type { AttributeValue, Span, SpanEvent } from './entities/span';
export type { TimeRange } from './entities/time-range';
export type { Trace } from './entities/trace';
export { Aggregate, AlertStatus } from './entities/alert-rule';
export { SpanKind, SpanStatusCode } from './entities/span';

// Repositories (ports)
export type { AlertRepository } from './repositories/alert-repository';
export type { Page, Pagination } from './repositories/pagination';
export type { TelemetryRepository, TraceQuery } from './repositories/telemetry-repository';

// Functions: traces
export { criticalPath } from './functions/critical-path';
export { getSpansByTrace, summarizeTraces } from './functions/summarize-traces';

// Functions: RED metrics
export { buildRedPoints } from './functions/build-red-points';
export { percentile } from './functions/percentile';
export { summarizeServiceRed } from './functions/summarize-service-red';
export { timeRangeToMs } from './functions/time-range-to-ms';

// Functions: alerts
export { evaluateRule } from './functions/evaluate-rule';
export type { RuleEvaluation } from './functions/evaluate-rule';
