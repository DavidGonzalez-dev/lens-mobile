export interface Trace {
  traceId: string;
  rootService: string;
  rootName: string;
  startMs: number;
  durationNs: number;
  spanCount: number;
  hasError: boolean;
}
