import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  loading = false;
  errorMessage: string | null = null;
  returnUrl: string = '/dtes';
  mostrarPassword = false;
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Obtener returnUrl de query params si existe
    this.route.queryParams.subscribe(params => {
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
    });

    // Si ya está autenticado, redirigir
    this.subscriptions.add(
      this.authService.isAuthenticated().subscribe(isAuth => {
        if (isAuth) {
          this.router.navigate([this.returnUrl]);
        }
      })
    );

    // Para debugging: consultar usuarios registrados
    this.consultarUsuariosRegistrados();
  }

  /**
   * Consulta usuarios registrados en la base de datos (solo para debugging)
   */
  private consultarUsuariosRegistrados(): void {
    this.subscriptions.add(
      this.authService.getAllUsers().subscribe(users => {
        if (users.length > 0) {
          console.log('=== USUARIOS REGISTRADOS EN LA BASE DE DATOS ===');
          users.forEach(user => {
            console.log(`- Email: ${user.email}, ID: ${user.id}, Nombre: ${user.display_name || 'Sin nombre'}, Creado: ${user.created_at}`);
          });
          console.log('===============================================');
        } else {
          console.warn('⚠️ No hay usuarios registrados en la base de datos. Usa el usuario por defecto: admin@test.com / admin123');
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  entrar(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    const { email, password } = this.loginForm.value;

    this.subscriptions.add(
      this.authService.login(email, password).subscribe({
        next: (user) => {
          // Login exitoso, redirigir
          this.router.navigate([this.returnUrl]);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.message || 'Ocurrió un error al iniciar sesión';
        }
      })
    );
  }

  irAForgetPassword(): void {
    this.router.navigateByUrl('/forgot-password');
  }

  irASignUp(): void {
    this.router.navigateByUrl('/sign-up');
  }

  /**
   * Marca todos los campos del formulario como touched para mostrar errores
   */
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   */
  getFieldError(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    if (control?.hasError('required')) {
      return fieldName === 'email' 
        ? 'El correo electrónico es requerido'
        : 'La contraseña es requerida';
    }
    if (control?.hasError('email')) {
      return 'Ingresa un correo electrónico válido';
    }
    if (control?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  }

  /**
   * Verifica si un campo tiene error y ha sido touched
   */
  hasFieldError(fieldName: string): boolean {
    const control = this.loginForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  toggleMostrarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }
}


