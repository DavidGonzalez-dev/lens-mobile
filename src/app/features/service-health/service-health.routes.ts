import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/service-list.page').then((m) => m.ServiceListPage),
  },
  {
    path: ':service',
    loadComponent: () => import('./pages/service-detail.page').then((m) => m.ServiceDetailPage),
  },
];
