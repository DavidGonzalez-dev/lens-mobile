import type { Routes } from '@angular/router';


export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./tabs.page').then(c => c.TabsPage)
  }
 ];
