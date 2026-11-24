import { SpanStatusCode, type Span } from '../../domain';

import { between, randomHex } from './random';
import type { TopologyNode } from './topology';

interface BuiltSubtree {
  spans: Span[];
  durationMs: number;
}

export function buildTrace(rng: () => number, root: TopologyNode, startMs: number): Span[] {
  const traceId = randomHex(rng, 32);
  const subtree = buildSubtree(rng, root, startMs, traceId, null);
  return subtree.spans;
}

function buildSubtree(
  rng: () => number,
  node: TopologyNode,
  startMs: number,
  traceId: string,
  parentId: string | null,
): BuiltSubtree {
  const spanId = randomHex(rng, 16);
  const ownWorkMs = between(rng, node.latencyMs.min, node.latencyMs.max);
  let cursorMs = startMs + ownWorkMs;

  const childSpans: Span[] = [];

  for (const child of node.children) {
    const childSubtree = buildSubtree(rng, child, cursorMs, traceId, spanId);
    childSpans.push(...childSubtree.spans);
    cursorMs += childSubtree.durationMs;
  }

  const durationMs = cursorMs - startMs;
  // Only draw a random number when the node can fail, so healthy data stays the same.
  const error = node.error;
  const failed = error !== undefined && rng() < error.rate;

  const span: Span = {
    traceId: traceId,
    spanId: spanId,
    parentSpanId: parentId,
    service: node.service,
    name: node.name,
    kind: node.kind,
    startMs: startMs,
    durationNs: durationMs * 1_000_000,
    statusCode: failed ? SpanStatusCode.ERROR : SpanStatusCode.OK,
    statusMessage: failed ? error!.message : null,
    // OpenTelemetry records a failure as an `exception` event at the moment the span ends.
    events: failed
      ? [
          {
            name: 'exception',
            timestampMs: startMs + durationMs,
            attributes: { 'exception.type': 'HttpError', 'exception.message': error!.message },
          },
        ]
      : [],
    attributes: failed ? { ...node.attributes, ...error!.attributes } : { ...node.attributes },
  };

  return { spans: [span, ...childSpans], durationMs: durationMs };
}
