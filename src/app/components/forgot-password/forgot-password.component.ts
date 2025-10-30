import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  constructor(private router: Router) {}

  enviar(): void {
    console.log('Enviar instrucciones');
  }

  entrar(): void {
    this.router.navigateByUrl('/login');
  }
}

