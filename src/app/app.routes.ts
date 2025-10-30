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
    path: 'forgot-password',
    loadComponent: () =>
      import('./components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'sign-up',
    loadComponent: () =>
      import('./components/sign-up/sign-up.component').then(m => m.SignUpComponent)
  },
  {
    path: 'terminos-y-condiciones',
    loadComponent: () =>
      import('./components/terms/terms.component').then(m => m.TermsComponent)
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./components/blank/blank.component').then(m => m.BlankComponent)
  }
];
