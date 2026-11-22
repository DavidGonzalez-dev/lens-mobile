import type { Span } from '../../telemetry/domain';

const NS_PER_MS = 1_000_000;

/** One row of the waterfall: a span, how deep it is in the tree and where its bar goes. */
export interface WaterfallRow {
  span: Span;
  /** 0 for the root, 1 for its children, 2 for grandchildren... Used to indent the name. */
  depth: number;
  /** Where the bar starts, as a percentage (0–100) of the root's duration. */
  offsetPct: number;
  /** How long the bar is, as a percentage (0–100) of the root's duration. */
  widthPct: number;
}

/**
 * Orders the spans of ONE trace the way a waterfall shows them: depth-first, each parent
 * followed by its children, children sorted by startMs ascending (ties by spanId).
 *
 * Units: startMs is in MILLISECONDS, durationNs in NANOSECONDS. Convert before dividing.
 *   offsetPct = (span.startMs - root.startMs) / rootDurationMs * 100
 *   widthPct  = spanDurationMs / rootDurationMs * 100
 * A root that lasts 0 ms would divide by zero: give every bar offsetPct 0 and widthPct 100.
 * No root (no span with parentSpanId null) → [].
 */
export function buildWaterfall(spans: Span[]): WaterfallRow[] {
  const root = spans.find((span) => span.parentSpanId === null);
  if (root === undefined) {
    return [];
  }

  const rootStartMs = root.startMs;
  const rootDurationMs = root.durationNs / NS_PER_MS;
  const rows: WaterfallRow[] = [];

  function visit(span: Span, depth: number): void {
    const durationMs = span.durationNs / NS_PER_MS;

    rows.push({
      span,
      depth,
      offsetPct: rootDurationMs === 0 ? 0 : ((span.startMs - rootStartMs) / rootDurationMs) * 100,
      widthPct: rootDurationMs === 0 ? 100 : (durationMs / rootDurationMs) * 100,
    });

    const children = spans
      .filter((child) => child.parentSpanId === span.spanId)
      .sort((a, b) => a.startMs - b.startMs || a.spanId.localeCompare(b.spanId));

    for (const child of children) {
      visit(child, depth + 1);
    }
  }

  visit(root, 0);
  return rows;
}
