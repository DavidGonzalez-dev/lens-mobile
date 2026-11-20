import { describe, expect, it } from 'vitest';

import { paginate } from './paginate';

const ITEMS = ['a', 'b', 'c', 'd', 'e'];

describe('paginate', () => {
  it('returns the first page and says there is more', () => {
    expect(paginate(ITEMS, { offset: 0, limit: 2 })).toEqual({ data: ['a', 'b'], hasMore: true });
  });

  it('returns a middle page', () => {
    expect(paginate(ITEMS, { offset: 2, limit: 2 })).toEqual({ data: ['c', 'd'], hasMore: true });
  });

  it('returns a short last page with nothing more', () => {
    expect(paginate(ITEMS, { offset: 4, limit: 2 })).toEqual({ data: ['e'], hasMore: false });
  });

  it('says there is nothing more when the page ends exactly at the last item', () => {
    expect(paginate(ITEMS, { offset: 3, limit: 2 })).toEqual({ data: ['d', 'e'], hasMore: false });
  });

  it('returns an empty page past the end', () => {
    expect(paginate(ITEMS, { offset: 10, limit: 2 })).toEqual({ data: [], hasMore: false });
  });
});
