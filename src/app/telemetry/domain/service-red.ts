/** RED summary of a service over a time range. Derived from `RedPoint`s, never stored. */
export interface ServiceRed {
  service: string
  rps: number
  /** Ratio between 0 and 1. */
  errorRate: number
  p99Ns: number
}
