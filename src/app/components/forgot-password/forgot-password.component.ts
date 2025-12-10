import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  forgotPasswordForm: FormGroup;
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  emailSent = false;
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
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

  enviar(): void {
    if (this.forgotPasswordForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.emailSent = false;

    const { email } = this.forgotPasswordForm.value;

    this.subscriptions.add(
      this.authService.sendPasswordReset(email).subscribe({
        next: () => {
          this.loading = false;
          this.emailSent = true;
          this.successMessage = `Se ha enviado un correo a ${email} con las instrucciones para restablecer tu contraseña.`;
          
          // Limpiar formulario
          this.forgotPasswordForm.reset();
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.message || 'Ocurrió un error al enviar el correo';
        }
      })
    );
  }

  entrar(): void {
    this.router.navigateByUrl('/login');
  }

  /**
   * Marca todos los campos del formulario como touched para mostrar errores
   */
  private markFormGroupTouched(): void {
    Object.keys(this.forgotPasswordForm.controls).forEach(key => {
      const control = this.forgotPasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   */
  getFieldError(fieldName: string): string {
    const control = this.forgotPasswordForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return 'El correo electrónico es requerido';
    }
    
    if (control?.hasError('email')) {
      return 'Ingresa un correo electrónico válido';
    }
    
    return '';
  }

  /**
   * Verifica si un campo tiene error y ha sido touched
   */
  hasFieldError(fieldName: string): boolean {
    const control = this.forgotPasswordForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  /**
   * Permite enviar otro correo (restablece el estado)
   */
  enviarOtroCorreo(): void {
    this.emailSent = false;
    this.successMessage = null;
    this.errorMessage = null;
  }
}

