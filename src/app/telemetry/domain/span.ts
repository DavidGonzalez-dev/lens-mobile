export type AttributeValue = string | number | boolean

export enum SpanKind {
  INTERNAL = "INTERNAL",
  SERVER = "SERVER",
  CLIENT = "CLIENT",
  PRODUCER = "PRODUCER",
  CONSUMER = "CONSUMER",
}

export enum SpanStatusCode {
  UNSET = "UNSET",
  OK = "OK",
  ERROR = "ERROR",
}

export interface SpanEvent {
  name: string
  timestampMs: number
  attributes: Record<string, AttributeValue>
}

export interface Span {
  traceId: string
  spanId: string
  parentSpanId: string | null
  service: string
  name: string
  kind: SpanKind
  startMs: number
  durationNs: number
  statusCode: SpanStatusCode
  statusMessage: string | null
  attributes: Record<string, AttributeValue>
  events: SpanEvent[]
}
