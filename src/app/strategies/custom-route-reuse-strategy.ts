import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';

export class CustomRouteReuseStrategy implements RouteReuseStrategy {
  private storedRoutes = new Map<string, DetachedRouteHandle>();
  
  // Rutas que comparten el mismo componente ClientesPageComponent
  private readonly clientesRoutes = ['clientes', 'sucursales', 'productos'];
  private readonly clientesComponentKey = 'clientes-page-component';
  
  // Rutas que comparten el mismo componente BlankComponent
  private readonly blankRoutes = ['home', 'dtes'];
  private readonly blankComponentKey = 'blank-component';

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return this.isReusableRoute(route);
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    const routePath = route.routeConfig?.path || '';
    
    if (this.clientesRoutes.includes(routePath)) {
      // Usar una clave única para todas las rutas que usan ClientesPageComponent
      this.storedRoutes.set(this.clientesComponentKey, handle);
    } else if (this.blankRoutes.includes(routePath)) {
      // Usar una clave única para todas las rutas que usan BlankComponent
      this.storedRoutes.set(this.blankComponentKey, handle);
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const routePath = route.routeConfig?.path || '';
    
    if (this.clientesRoutes.includes(routePath)) {
      return this.storedRoutes.has(this.clientesComponentKey);
    } else if (this.blankRoutes.includes(routePath)) {
      return this.storedRoutes.has(this.blankComponentKey);
    }
    
    return false;
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const routePath = route.routeConfig?.path || '';
    
    if (this.clientesRoutes.includes(routePath)) {
      return this.storedRoutes.get(this.clientesComponentKey) || null;
    } else if (this.blankRoutes.includes(routePath)) {
      return this.storedRoutes.get(this.blankComponentKey) || null;
    }
    
    return null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    const futurePath = future.routeConfig?.path || '';
    const currPath = curr.routeConfig?.path || '';
    
    // Si ambas rutas son del mismo grupo reutilizable, forzar reutilización
    if (this.isSameReusableGroup(futurePath, currPath)) {
      return true;
    }
    
    // También verificar si las rutas tienen el mismo componente cargado
    const futureComponent = future.component || future.routeConfig?.loadComponent;
    const currComponent = curr.component || curr.routeConfig?.loadComponent;
    
    // Si ambas rutas apuntan al mismo componente (incluso si es lazy loading), reutilizar
    if (futureComponent === currComponent && 
        (this.isReusableRoute(future) || this.isReusableRoute(curr))) {
      return true;
    }
    
    // Comportamiento por defecto
    return future.routeConfig === curr.routeConfig;
  }

  private isReusableRoute(route: ActivatedRouteSnapshot): boolean {
    const path = route.routeConfig?.path || '';
    return this.clientesRoutes.includes(path) || this.blankRoutes.includes(path);
  }

  private isSameReusableGroup(path1: string, path2: string): boolean {
    // Verificar si ambas rutas pertenecen al mismo grupo reutilizable
    const group1 = this.getReusableGroup(path1);
    const group2 = this.getReusableGroup(path2);
    return group1 !== null && group1 === group2;
  }

  private getReusableGroup(path: string): string | null {
    if (this.clientesRoutes.includes(path)) {
      return 'clientes';
    } else if (this.blankRoutes.includes(path)) {
      return 'blank';
    }
    return null;
  }
}

