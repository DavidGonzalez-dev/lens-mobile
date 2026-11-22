/** Distinct colors that read well on light and dark backgrounds. */
const PALETTE = ['#4f8ef7', '#2dd36f', '#ffc409', '#9a6bff', '#ff8a3d', '#3dc2ff', '#ff5ca8', '#8bc34a'];

/** Fixed colors for the demo shop, so no two of its services ever share one. */
const KNOWN_SERVICES: Record<string, string> = {
  frontend: PALETTE[0],
  checkout: PALETTE[1],
  inventory: PALETTE[2],
  payment: PALETTE[3],
  catalog: PALETTE[4],
};

/** Same service, same color, on every screen and every launch (RF-04: color by service). */
export function serviceColor(service: string): string {
  const known = KNOWN_SERVICES[service];
  if (known !== undefined) {
    return known;
  }

  let hash = 0;
  for (const char of service) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
