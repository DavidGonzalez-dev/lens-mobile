import { SpanKind, type Span } from '../../domain';

/** Inclusive range, in milliseconds, of a node's own work (children excluded). */
export interface LatencyRange {
  min: number;
  max: number;
}

/** How a node fails. When it fails, its span gets ERROR status, the message and the extra attributes. */
export interface ErrorBehavior {
  /** Probability of failing, between 0 (never) and 1 (always). */
  rate: number;
  message: string;
  attributes: Span['attributes'];
}

/** One step of the demo shop call graph. The generator turns each node into a span. */
export interface TopologyNode {
  service: Span['service'];
  name: Span['name'];
  kind: Span['kind'];
  latencyMs: LatencyRange;
  attributes: Span['attributes'];
  children: TopologyNode[];
  /** Missing means the node never fails. */
  error?: ErrorBehavior;
}

export const checkoutOperation: TopologyNode = {
  service: 'frontend',
  name: 'GET /checkout',
  kind: SpanKind.SERVER,
  latencyMs: { min: 1, max: 5 },
  attributes: { 'http.request.method': 'GET', 'http.route': '/checkout' },
  children: [
    {
      service: 'checkout',
      name: 'POST /orders',
      kind: SpanKind.SERVER,
      latencyMs: { min: 1, max: 5 },
      attributes: { 'http.request.method': 'POST', 'http.route': '/orders' },
      children: [
        {
          service: 'inventory',
          name: 'reserve stock',
          kind: SpanKind.SERVER,
          latencyMs: { min: 1, max: 5 },
          attributes: { 'http.request.method': 'POST', 'http.route': '/stock/reserve' },
          children: [
            {
              service: 'inventory',
              name: 'SELECT stock',
              kind: SpanKind.CLIENT,
              latencyMs: { min: 2, max: 10 },
              attributes: {
                'db.system': 'postgresql',
                'db.statement': 'SELECT quantity FROM stock WHERE sku = ?',
              },
              children: [],
            },
          ],
        },
        {
          service: 'payment',
          name: 'charge card',
          kind: SpanKind.SERVER,
          latencyMs: { min: 50, max: 150 },
          attributes: { 'http.request.method': 'POST', 'http.route': '/payments' },
          children: [],
        },
      ],
    },
  ],
};

export const productsOperation: TopologyNode = {
  service: 'frontend',
  name: 'GET /products',
  kind: SpanKind.SERVER,
  latencyMs: { min: 1, max: 5 },
  attributes: { 'http.request.method': 'GET', 'http.route': '/products' },
  children: [
    {
      service: 'catalog',
      name: 'list products',
      kind: SpanKind.SERVER,
      latencyMs: { min: 1, max: 5 },
      attributes: { 'http.request.method': 'GET', 'http.route': '/products' },
      children: [
        {
          service: 'catalog',
          name: 'SELECT products',
          kind: SpanKind.CLIENT,
          latencyMs: { min: 2, max: 10 },
          attributes: {
            'db.system': 'postgresql',
            'db.statement': 'SELECT id, name, price FROM products LIMIT 20',
          },
          children: [],
        },
      ],
    },
  ],
};

export const entryOperations: TopologyNode[] = [checkoutOperation, productsOperation];
