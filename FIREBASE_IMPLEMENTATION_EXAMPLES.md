# Ejemplos de Implementación Firebase
## Guía de Código para Integración con Firebase

---

## 📦 Instalación de Dependencias

```bash
npm install @angular/fire firebase
```

---

## 🔧 Configuración Inicial

### 1. Configurar Firebase en `app.config.ts` o `app.module.ts`

```typescript
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideStorage, getStorage } from '@angular/fire/storage';

export const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "TU_APP_ID"
};

export const appConfig: ApplicationConfig = {
  providers: [
    // ... otros providers
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideStorage(() => getStorage())
  ]
};
```

---

## 🔐 Servicio de Autenticación

### `auth.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  login(email: string, password: string): Observable<User> {
    return from(signInWithEmailAndPassword(this.auth, email, password)
      .then(result => result.user));
  }

  register(email: string, password: string): Observable<User> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)
      .then(result => {
        // Crear documento de usuario en Firestore después del registro
        return result.user;
      }));
  }

  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  getCurrentUserId(): string | null {
    return this.auth.currentUser?.uid || null;
  }
}
```

---

## 👤 Servicio de Usuario/Empresa

### `firebase-user.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { Firestore, doc, docData, updateDoc, setDoc, serverTimestamp } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {}

  getCurrentUserData(): Observable<any> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return of(null);
        const userDocRef = doc(this.firestore, `users/${userId}`);
        return docData(userDocRef);
      })
    );
  }

  createUserProfile(userId: string, userData: any): Observable<void> {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    return from(setDoc(userDocRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }));
  }

  updateUserProfile(userId: string, data: Partial<any>): Observable<void> {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    return from(updateDoc(userDocRef, {
      ...data,
      updatedAt: serverTimestamp()
    }));
  }
}
```

---

## 👥 Servicio de Clientes

### `firebase-clientes.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  docData, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, from, EMPTY } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {}

  private getClientesCollection(userId: string) {
    return collection(this.firestore, `users/${userId}/clientes`);
  }

  getClientes(): Observable<any[]> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return EMPTY;
        const clientesRef = this.getClientesCollection(userId);
        const q = query(
          clientesRef, 
          where('activo', '==', true),
          orderBy('nombre')
        );
        return collectionData(q, { idField: 'id' });
      })
    );
  }

  getCliente(clienteId: string): Observable<any> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return EMPTY;
        const clienteRef = doc(this.firestore, `users/${userId}/clientes/${clienteId}`);
        return docData(clienteRef, { idField: 'id' });
      })
    );
  }

  crearCliente(cliente: any): Observable<string> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return EMPTY;
        const clientesRef = this.getClientesCollection(userId);
        return from(addDoc(clientesRef, {
          ...cliente,
          activo: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: userId
        }).then(docRef => docRef.id));
      })
    );
  }

  actualizarCliente(clienteId: string, data: Partial<any>): Observable<void> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return EMPTY;
        const clienteRef = doc(this.firestore, `users/${userId}/clientes/${clienteId}`);
        return from(updateDoc(clienteRef, {
          ...data,
          updatedAt: serverTimestamp()
        }));
      })
    );
  }

  eliminarCliente(clienteId: string): Observable<void> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return EMPTY;
        // Soft delete: marcar como inactivo
        const clienteRef = doc(this.firestore, `users/${userId}/clientes/${clienteId}`);
        return from(updateDoc(clienteRef, {
          activo: false,
          updatedAt: serverTimestamp()
        }));
      })
    );
  }

  buscarClientePorDocumento(numeroDocumento: string): Observable<any[]> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return EMPTY;
        const clientesRef = this.getClientesCollection(userId);
        const q = query(
          clientesRef,
          where('numeroDocumento', '==', numeroDocumento),
          where('activo', '==', true)
        );
        return collectionData(q, { idField: 'id' });
      })
    );
  }
}
```

---

## 📦 Servicio de Productos

### `firebase-productos.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  docData, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, from, EMPTY } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {}

  private getProductosCollection(userId: string) {
    return collection(this.firestore, `users/${userId}/productos`);
  }

  getProductos(): Observable<any[]> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return EMPTY;
        const productosRef = this.getProductosCollection(userId);
        const q = query(
          productosRef, 
          where('activo', '==', true),
          orderBy('nombre')
        );
        return collectionData(q, { idField: 'id' });
      })
    );
  }

  getProducto(productoId: string): Observable<any> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return EMPTY;
        const productoRef = doc(this.firestore, `users/${userId}/productos/${productoId}`);
        return docData(productoRef, { idField: 'id' });
      })
    );
  }

  crearProducto(producto: any): Observable<string> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return EMPTY;
        const productosRef = this.getProductosCollection(userId);
        return from(addDoc(productosRef, {
          ...producto,
          activo: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: userId
        }).then(docRef => docRef.id));
      })
    );
  }

  actualizarProducto(productoId: string, data: Partial<any>): Observable<void> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return EMPTY;
        const productoRef = doc(this.firestore, `users/${userId}/productos/${productoId}`);
        return from(updateDoc(productoRef, {
          ...data,
          updatedAt: serverTimestamp()
        }));
      })
    );
  }

  buscarProductoPorCodigo(codigo: string): Observable<any[]> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return EMPTY;
        const productosRef = this.getProductosCollection(userId);
        const q = query(
          productosRef,
          where('codigoInterno', '==', codigo),
          where('activo', '==', true)
        );
        return collectionData(q, { idField: 'id' });
      })
    );
  }
}
```

---

## 📄 Servicio de DTEs

### `firebase-dtes.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  docData, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp,
  Timestamp 
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, from, EMPTY } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PeriodoTributario } from '../models/periodo-tributario.model';

@Injectable({
  providedIn: 'root'
})
export class DtesService {
  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {}

  private getDtesCollection(userId: string) {
    return collection(this.firestore, `users/${userId}/dtes`);
  }

  getDTEs(filtro?: { tipoTab?: 'enviados' | 'recibidos', periodo?: PeriodoTributario }): Observable<any[]> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return EMPTY;
        
        const dtesRef = this.getDtesCollection(userId);
        let q = query(dtesRef, orderBy('fechaEmision', 'desc'), limit(100));
        
        // Filtrar por período si se proporciona
        if (filtro?.periodo) {
          const { mes, año } = filtro.periodo;
          q = query(
            dtesRef,
            where('periodo.año', '==', año),
            where('periodo.mes', '==', mes),
            orderBy('fechaEmision', 'desc')
          );
        }
        
        // Filtrar por estado (enviados vs recibidos)
        if (filtro?.tipoTab === 'enviados') {
          q = query(dtesRef, where('estado', '!=', 'BORRADOR'), orderBy('fechaEmision', 'desc'));
        }
        
        return collectionData(q, { idField: 'id' });
      })
    );
  }

  getDTE(dteId: string): Observable<any> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return EMPTY;
        const dteRef = doc(this.firestore, `users/${userId}/dtes/${dteId}`);
        return docData(dteRef, { idField: 'id' });
      })
    );
  }

  crearDTE(dte: any): Observable<string> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return EMPTY;
        
        // Obtener el siguiente número de documento
        const numero = this.getNextDocumentNumber(userId, dte.tipoDTE);
        
        const dtesRef = this.getDtesCollection(userId);
        const fechaEmision = Timestamp.now();
        const periodo = {
          mes: fechaEmision.toDate().getMonth() + 1,
          año: fechaEmision.toDate().getFullYear()
        };
        
        return from(addDoc(dtesRef, {
          ...dte,
          numeroDocumento: numero,
          fechaEmision: fechaEmision,
          periodo: periodo,
          estado: 'BORRADOR',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: userId
        }).then(docRef => docRef.id));
      })
    );
  }

  actualizarDTE(dteId: string, data: Partial<any>): Observable<void> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return EMPTY;
        const dteRef = doc(this.firestore, `users/${userId}/dtes/${dteId}`);
        return from(updateDoc(dteRef, {
          ...data,
          updatedAt: serverTimestamp()
        }));
      })
    );
  }

  enviarDTE(dteId: string, datosEnvio: any): Observable<void> {
    return this.actualizarDTE(dteId, {
      estado: 'ENVIADO',
      mh: {
        estadoEnvio: 'PENDIENTE',
        fechaEnvio: serverTimestamp()
      },
      ...datosEnvio
    });
  }

  private async getNextDocumentNumber(userId: string, tipoDTE: string): Promise<number> {
    // Implementar lógica para obtener el siguiente número
    // Esto puede requerir usar una colección de contadores o transacciones
    // Por ahora, ejemplo simple:
    const dtesRef = this.getDtesCollection(userId);
    const q = query(
      dtesRef,
      where('tipoDTE', '==', tipoDTE),
      orderBy('numeroDocumento', 'desc'),
      limit(1)
    );
    
    // TODO: Implementar lógica completa de numeración
    return 1;
  }

  buscarDTEPorControlNumber(controlNumber: string): Observable<any[]> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return EMPTY;
        const dtesRef = this.getDtesCollection(userId);
        const q = query(
          dtesRef,
          where('controlNumber', '==', controlNumber)
        );
        return collectionData(q, { idField: 'id' });
      })
    );
  }
}
```

---

## 🏢 Servicio de Sucursales

### `firebase-sucursales.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  docData, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, from, EMPTY } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SucursalesService {
  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {}

  private getSucursalesCollection(userId: string) {
    return collection(this.firestore, `users/${userId}/sucursales`);
  }

  getSucursales(): Observable<any[]> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return EMPTY;
        const sucursalesRef = this.getSucursalesCollection(userId);
        const q = query(
          sucursalesRef, 
          where('activo', '==', true),
          orderBy('nombre')
        );
        return collectionData(q, { idField: 'id' });
      })
    );
  }

  getSucursal(sucursalId: string): Observable<any> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return EMPTY;
        const sucursalRef = doc(this.firestore, `users/${userId}/sucursales/${sucursalId}`);
        return docData(sucursalRef, { idField: 'id' });
      })
    );
  }

  crearSucursal(sucursal: any): Observable<string> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return EMPTY;
        const sucursalesRef = this.getSucursalesCollection(userId);
        return from(addDoc(sucursalesRef, {
          ...sucursal,
          activo: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: userId
        }).then(docRef => docRef.id));
      })
    );
  }
}
```

---

## 📤 Servicio de Storage (Archivos)

### `firebase-storage.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { AuthService } from './auth.service';
import { Observable, from, EMPTY } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor(
    private storage: Storage,
    private authService: AuthService
  ) {}

  subirArchivoDTE(dteId: string, archivo: File, tipo: 'pdf' | 'xml' | 'qr'): Observable<string> {
    return this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (!userId) return EMPTY;
        const path = `users/${userId}/dtes/${dteId}/${tipo}/${archivo.name}`;
        const storageRef = ref(this.storage, path);
        return from(uploadBytes(storageRef, archivo).then(
          () => getDownloadURL(storageRef)
        ));
      })
    );
  }

  eliminarArchivo(url: string): Observable<void> {
    const storageRef = ref(this.storage, url);
    return from(deleteObject(storageRef));
  }
}
```

---

## 🔄 Ejemplo de Uso en Componentes

### Actualizar `clientes-page.component.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { ClientesService } from '../../services/firebase-clientes.service';

@Component({
  selector: 'app-clientes-page',
  // ...
})
export class ClientesPageComponent implements OnInit {
  clientes: any[] = [];

  constructor(private clientesService: ClientesService) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.clientesService.getClientes().subscribe(clientes => {
      this.clientes = clientes;
    });
  }

  onClienteCreado(cliente: any): void {
    this.clientesService.crearCliente(cliente).subscribe(id => {
      console.log('Cliente creado con ID:', id);
      this.cargarClientes(); // Recargar lista
    });
  }
}
```

---

## 🔐 Guard de Autenticación

### `auth.guard.ts`

```typescript
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';
import { authState } from '@angular/fire/auth';

export const authGuard = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),
    map(user => {
      if (user) {
        return true;
      } else {
        router.navigate(['/login']);
        return false;
      }
    })
  );
};
```

### Usar en rutas:

```typescript
{
  path: 'clientes',
  loadComponent: () => import('./pages/clientes/clientes-page.component').then(m => m.ClientesPageComponent),
  canActivate: [authGuard]
}
```

---

## 📊 Manejo de Timestamps

### Convertir Firestore Timestamp a Date:

```typescript
import { Timestamp } from '@angular/fire/firestore';

// En el servicio o componente
convertTimestampToDate(timestamp: Timestamp | any): Date {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  return new Date(timestamp);
}
```

### Helper para manejar fechas en formularios:

```typescript
import { Timestamp } from '@angular/fire/firestore';

// Convertir Date a Timestamp para guardar
dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

// Convertir Timestamp a string para mostrar
timestampToDateString(timestamp: Timestamp | any): string {
  const date = this.convertTimestampToDate(timestamp);
  return date.toLocaleDateString('es-SV');
}
```

---

## 🎯 Próximos Pasos

1. Instalar `@angular/fire`
2. Configurar Firebase en tu proyecto
3. Crear los servicios mostrados arriba
4. Actualizar componentes existentes para usar los nuevos servicios
5. Implementar manejo de errores
6. Agregar loading states
7. Configurar reglas de seguridad en Firestore

---

*Documento de ejemplos de implementación - Sistema de Facturación Electrónica*

