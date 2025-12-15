import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { NotificacionModalComponent } from '../notificacion-modal/notificacion-modal.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NotificacionModalComponent],
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

  // Modal configuration
  showErrorModal = false;
  modalTitle = 'Credenciales Incorrectas';
  modalMessage = '';

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
    this.loginForm.disable(); // Deshabilitar formulario

    const { email, password } = this.loginForm.value;

    this.subscriptions.add(
      this.authService.login(email, password).subscribe({
        next: (user) => {
          // Login exitoso, redirigir
          this.router.navigate([this.returnUrl]);
        },
        error: (error) => {
          this.loading = false;
          this.loginForm.enable(); // Habilitar formulario
          const errorMsg = error.message || '';

          if (errorMsg.includes('401') || errorMsg.includes('Unauthorized') || errorMsg.includes('Correo o contraseña incorrectos')) {
            this.modalTitle = 'Credenciales Incorrectas';
            this.modalMessage = 'Las credenciales del usuario no pertenecen a ningun registro dentro de la plataforma. Por favor revisa sus credenciales o comunícate con su administrador.';
            this.showErrorModal = true;
          } else {
            this.errorMessage = errorMsg || 'Ocurrió un error al iniciar sesión';
          }
        }
      })
    );
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
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


