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

/** Knobs that change how the shop behaves. Incident scenarios override some of them. */
export interface ShopConditions {
  /** Own work of every database query. */
  dbLatencyMs: LatencyRange;
  /** How many `SELECT stock` queries `reserve stock` runs. */
  stockQueries: number;
  /** How many times `POST /orders` calls `charge card`. */
  paymentAttempts: number;
  /** Missing means `charge card` never fails. */
  paymentError?: ErrorBehavior;
}

export const HEALTHY: ShopConditions = {
  dbLatencyMs: { min: 2, max: 10 },
  stockQueries: 1,
  paymentAttempts: 1,
};

export function createCheckoutOperation(conditions: ShopConditions): TopologyNode {
  return {
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
            children: Array.from({ length: conditions.stockQueries }, () => ({
              service: 'inventory',
              name: 'SELECT stock',
              kind: SpanKind.CLIENT,
              latencyMs: conditions.dbLatencyMs,
              attributes: {
                'db.system': 'postgresql',
                'db.statement': 'SELECT quantity FROM stock WHERE sku = ?',
              },
              children: [],
            })),
          },
          ...Array.from({ length: conditions.paymentAttempts }, () => ({
            service: 'payment',
            name: 'charge card',
            kind: SpanKind.SERVER,
            latencyMs: { min: 50, max: 150 },
            attributes: { 'http.request.method': 'POST', 'http.route': '/payments' },
            children: [],
            error: conditions.paymentError,
          })),
        ],
      },
    ],
  };
}

export function createProductsOperation(conditions: ShopConditions): TopologyNode {
  return {
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
            latencyMs: conditions.dbLatencyMs,
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
}

export const checkoutOperation = createCheckoutOperation(HEALTHY);
export const productsOperation = createProductsOperation(HEALTHY);
export const entryOperations: TopologyNode[] = [checkoutOperation, productsOperation];
