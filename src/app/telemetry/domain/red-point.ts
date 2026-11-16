/** One-minute RED bucket for a single operation of a service (`service_red_1m`). */
export interface RedPoint {
  service: string;
  name: string;
  minuteMs: number;
  requestCount: number;
  errorCount: number;
  p50Ns: number;
  p90Ns: number;
  p99Ns: number;
}
