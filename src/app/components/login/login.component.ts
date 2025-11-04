import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  constructor(private router: Router) {}

  entrar(): void {
    // Redirigir a /dtes que mostrará el contenido principal
    this.router.navigateByUrl('/dtes');
  }

  irAForgetPassword(): void {
    this.router.navigateByUrl('/forgot-password');
  }

  irASignUp(): void {
    this.router.navigateByUrl('/sign-up');
  }
}


