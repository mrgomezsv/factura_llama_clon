import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./components/blank/blank.component').then(m => m.BlankComponent),
    canActivate: [authGuard]
  },
  {
    path: 'dtes',
    loadComponent: () =>
      import('./components/blank/blank.component').then(m => m.BlankComponent),
    canActivate: [authGuard]
  },
  {
    path: 'factura/nueva',
    loadComponent: () =>
      import('./pages/factura/factura-page.component').then(m => m.FacturaPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'comprobante-credito-fiscal/nueva',
    loadComponent: () =>
      import('./pages/comprobante-credito-fiscal/comprobante-credito-fiscal-page.component').then(m => m.ComprobanteCreditoFiscalPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'nota-credito/nueva',
    loadComponent: () =>
      import('./pages/nota-credito/nota-credito-page.component').then(m => m.NotaCreditoPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'nota-debito/nueva',
    loadComponent: () =>
      import('./pages/nota-debito/nota-debito-page.component').then(m => m.NotaDebitoPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'factura-sujeto-excluido/nueva',
    loadComponent: () =>
      import('./pages/factura-sujeto-excluido/factura-sujeto-excluido-page.component').then(m => m.FacturaSujetoExcluidoPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'factura-exportacion/nueva',
    loadComponent: () =>
      import('./pages/factura-exportacion/factura-exportacion-page.component').then(m => m.FacturaExportacionPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'nota-remision/nueva',
    loadComponent: () =>
      import('./pages/nota-remision/nota-remision-page.component').then(m => m.NotaRemisionPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'comprobante-retencion/nueva',
    loadComponent: () =>
      import('./pages/comprobante-retencion/comprobante-retencion-page.component').then(m => m.ComprobanteRetencionPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'clientes',
    loadComponent: () =>
      import('./pages/clientes/clientes-page.component').then(m => m.ClientesPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'sucursales',
    loadComponent: () =>
      import('./pages/clientes/clientes-page.component').then(m => m.ClientesPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'productos',
    loadComponent: () =>
      import('./pages/clientes/clientes-page.component').then(m => m.ClientesPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./pages/reportes/reportes-page.component').then(m => m.ReportesPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'contingencia',
    loadComponent: () =>
      import('./pages/contingencia-dashboard/contingencia-dashboard.component').then(m => m.ContingenciaDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(m => m.LoginComponent),
    canActivate: [loginGuard]
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'sign-up',
    loadComponent: () =>
      import('./components/sign-up/sign-up.component').then(m => m.SignUpComponent),
    canActivate: [loginGuard]
  },
  {
    path: 'terminos-y-condiciones',
    loadComponent: () =>
      import('./components/terms/terms.component').then(m => m.TermsComponent)
  }
];
