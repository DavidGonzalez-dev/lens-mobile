import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/trace-search.page').then((m) => m.TraceSearchPage),
  },
  {
    path: ':traceId',
    loadComponent: () => import('./pages/trace-waterfall.page').then((m) => m.TraceWaterfallPage),
  },
  {
    path: ':traceId/compare',
    loadComponent: () => import('./pages/trace-compare.page').then((m) => m.TraceComparePage),
  },
  {
    path: ':traceId/spans/:spanId',
    loadComponent: () => import('./pages/span-detail.page').then((m) => m.SpanDetailPage),
  },
];
