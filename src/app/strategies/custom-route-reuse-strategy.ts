import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';

export class CustomRouteReuseStrategy implements RouteReuseStrategy {
  private storedRoutes = new Map<string, DetachedRouteHandle>();
  private readonly reusableRoutes = ['clientes', 'sucursales', 'productos'];
  private readonly componentKey = 'clientes-page-component'; // Clave única para todas las rutas que usan el mismo componente

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return this.isReusableRoute(route);
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    // Usar una clave única para todas las rutas que usan el mismo componente
    if (this.isReusableRoute(route)) {
      this.storedRoutes.set(this.componentKey, handle);
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    // Verificar si tenemos el componente guardado para cualquiera de las rutas reutilizables
    return this.isReusableRoute(route) && this.storedRoutes.has(this.componentKey);
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    if (this.isReusableRoute(route)) {
      return this.storedRoutes.get(this.componentKey) || null;
    }
    return null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    const futurePath = future.routeConfig?.path || '';
    const currPath = curr.routeConfig?.path || '';
    
    // Si ambas rutas son reutilizables (mismo componente), forzar reutilización
    if (this.isReusableRoute(future) && this.isReusableRoute(curr)) {
      return true;
    }
    
    // También verificar si las rutas tienen el mismo componente cargado
    const futureComponent = future.component || future.routeConfig?.loadComponent;
    const currComponent = curr.component || curr.routeConfig?.loadComponent;
    
    // Si ambas rutas apuntan al mismo componente (incluso si es lazy loading), reutilizar
    if (futureComponent === currComponent && (this.isReusableRoute(future) || this.isReusableRoute(curr))) {
      return true;
    }
    
    // Comportamiento por defecto
    return future.routeConfig === curr.routeConfig;
  }

  private isReusableRoute(route: ActivatedRouteSnapshot): boolean {
    const path = route.routeConfig?.path || '';
    return this.reusableRoutes.includes(path);
  }
}

