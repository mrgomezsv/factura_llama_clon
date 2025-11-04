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
    path: 'comprobante-credito-fiscal/nueva',
    loadComponent: () =>
      import('./pages/comprobante-credito-fiscal/comprobante-credito-fiscal-page.component').then(m => m.ComprobanteCreditoFiscalPageComponent)
  },
  {
    path: 'nota-credito/nueva',
    loadComponent: () =>
      import('./pages/nota-credito/nota-credito-page.component').then(m => m.NotaCreditoPageComponent)
  },
  {
    path: 'nota-debito/nueva',
    loadComponent: () =>
      import('./pages/nota-debito/nota-debito-page.component').then(m => m.NotaDebitoPageComponent)
  },
  {
    path: 'factura-sujeto-excluido/nueva',
    loadComponent: () =>
      import('./pages/factura-sujeto-excluido/factura-sujeto-excluido-page.component').then(m => m.FacturaSujetoExcluidoPageComponent)
  },
  {
    path: 'factura-exportacion/nueva',
    loadComponent: () =>
      import('./pages/factura-exportacion/factura-exportacion-page.component').then(m => m.FacturaExportacionPageComponent)
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
