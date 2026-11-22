import type { Routes } from '@angular/router';

/** Each child path is one tab; it must match the `tab` attribute in tabs.page.html. */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'services',
        loadChildren: () => import('../features/service-health/service-health.routes').then((m) => m.routes),
      },
      {
        path: 'traces',
        loadChildren: () => import('../features/traces/traces.routes').then((m) => m.routes),
      },
      {
        path: 'alerts',
        loadChildren: () => import('../features/alerts/alerts.routes').then((m) => m.routes),
      },
      {
        path: 'settings',
        loadChildren: () => import('../features/settings/settings.routes').then((m) => m.routes),
      },
      {
        path: '',
        redirectTo: '/tabs/services',
        pathMatch: 'full',
      },
    ],
  },
];
