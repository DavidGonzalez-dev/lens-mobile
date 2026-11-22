import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/alert-rules.page').then((m) => m.AlertRulesPage),
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/alert-history.page').then((m) => m.AlertHistoryPage),
  },
  {
    path: 'new',
    loadComponent: () => import('./pages/alert-rule-edit.page').then((m) => m.AlertRuleEditPage),
  },
  {
    path: ':ruleId/edit',
    loadComponent: () => import('./pages/alert-rule-edit.page').then((m) => m.AlertRuleEditPage),
  },
];
