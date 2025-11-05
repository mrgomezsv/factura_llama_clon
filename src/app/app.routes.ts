import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./components/blank/blank.component').then(m => m.BlankComponent)
  },
  {
    path: 'dtes',
    loadComponent: () =>
      import('./components/blank/blank.component').then(m => m.BlankComponent)
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
    path: 'nota-remision/nueva',
    loadComponent: () =>
      import('./pages/nota-remision/nota-remision-page.component').then(m => m.NotaRemisionPageComponent)
  },
  {
    path: 'comprobante-retencion/nueva',
    loadComponent: () =>
      import('./pages/comprobante-retencion/comprobante-retencion-page.component').then(m => m.ComprobanteRetencionPageComponent)
  },
  {
    path: 'clientes',
    loadComponent: () =>
      import('./pages/clientes/clientes-page.component').then(m => m.ClientesPageComponent)
  },
  {
    path: 'sucursales',
    loadComponent: () =>
      import('./pages/clientes/clientes-page.component').then(m => m.ClientesPageComponent)
  },
  {
    path: 'productos',
    loadComponent: () =>
      import('./pages/clientes/clientes-page.component').then(m => m.ClientesPageComponent)
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./pages/reportes/reportes-page.component').then(m => m.ReportesPageComponent)
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
  }
];
