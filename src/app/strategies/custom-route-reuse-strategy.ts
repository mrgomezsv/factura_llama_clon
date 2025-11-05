import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';

export class CustomRouteReuseStrategy implements RouteReuseStrategy {
  private storedRoutes = new Map<string, DetachedRouteHandle>();

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // Reutilizar rutas para clientes, sucursales y productos (mismo componente)
    const paths = ['/clientes', '/sucursales', '/productos'];
    return paths.some(path => route.routeConfig?.path === path.split('/').pop());
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    if (route.routeConfig?.path) {
      this.storedRoutes.set(route.routeConfig.path, handle);
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    if (route.routeConfig?.path) {
      return this.storedRoutes.has(route.routeConfig.path);
    }
    return false;
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    if (route.routeConfig?.path) {
      return this.storedRoutes.get(route.routeConfig.path) || null;
    }
    return null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    // Reutilizar rutas cuando ambas usan el mismo componente (clientes, sucursales, productos)
    const sameComponentRoutes = ['clientes', 'sucursales', 'productos'];
    const futurePath = future.routeConfig?.path || '';
    const currPath = curr.routeConfig?.path || '';
    
    if (sameComponentRoutes.includes(futurePath) && sameComponentRoutes.includes(currPath)) {
      return true;
    }
    
    return future.routeConfig === curr.routeConfig;
  }
}

