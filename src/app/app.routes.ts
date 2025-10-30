import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'factura/nueva',
    loadComponent: () =>
      import('./pages/factura/factura-page.component').then(m => m.FacturaPageComponent)
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./components/blank/blank.component').then(m => m.BlankComponent)
  }
];
