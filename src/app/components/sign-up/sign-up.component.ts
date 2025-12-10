import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit, OnDestroy {
  signupForm: FormGroup;
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      nombreNegocio: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      acceptTerms: [false, [Validators.requiredTrue]]
    });
  }

  ngOnInit(): void {
    // Si ya está autenticado, redirigir
    this.subscriptions.add(
      this.authService.isAuthenticated().subscribe(isAuth => {
        if (isAuth) {
          this.router.navigate(['/dtes']);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  crearCuenta(): void {
    if (this.signupForm.invalid) {
      this.markFormGroupTouched();
      
      // Mensaje especial si no acepta términos
      if (this.signupForm.get('acceptTerms')?.invalid) {
        this.errorMessage = 'Debes aceptar los términos de servicio y política de privacidad';
      }
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const { nombreNegocio, email, password } = this.signupForm.value;

    this.subscriptions.add(
      this.authService.register(email, password, nombreNegocio).subscribe({
        next: (user) => {
          this.loading = false;
          this.successMessage = '¡Cuenta creada exitosamente! Redirigiendo...';
          
          // Redirigir después de un breve delay
          setTimeout(() => {
            this.router.navigate(['/dtes']);
          }, 1500);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.message || 'Ocurrió un error al crear la cuenta';
        }
      })
    );
  }

  entrar(): void {
    this.router.navigateByUrl('/login');
  }

  irATerminos(): void {
    this.router.navigateByUrl('/terminos-y-condiciones');
  }

  /**
   * Marca todos los campos del formulario como touched para mostrar errores
   */
  private markFormGroupTouched(): void {
    Object.keys(this.signupForm.controls).forEach(key => {
      const control = this.signupForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   */
  getFieldError(fieldName: string): string {
    const control = this.signupForm.get(fieldName);
    
    if (control?.hasError('required')) {
      if (fieldName === 'acceptTerms') {
        return 'Debes aceptar los términos y condiciones';
      }
      if (fieldName === 'nombreNegocio') {
        return 'El nombre del negocio es requerido';
      }
      if (fieldName === 'email') {
        return 'El correo electrónico es requerido';
      }
      if (fieldName === 'password') {
        return 'La contraseña es requerida';
      }
    }
    
    if (control?.hasError('email')) {
      return 'Ingresa un correo electrónico válido';
    }
    
    if (control?.hasError('minlength')) {
      if (fieldName === 'password') {
        return 'La contraseña debe tener al menos 6 caracteres';
      }
      if (fieldName === 'nombreNegocio') {
        return 'El nombre debe tener al menos 2 caracteres';
      }
    }
    
    if (control?.hasError('maxlength')) {
      if (fieldName === 'nombreNegocio') {
        return 'El nombre no puede exceder 100 caracteres';
      }
    }

    if (control?.hasError('requiredTrue')) {
      return 'Debes aceptar los términos y condiciones';
    }
    
    return '';
  }

  /**
   * Verifica si un campo tiene error y ha sido touched
   */
  hasFieldError(fieldName: string): boolean {
    const control = this.signupForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}

