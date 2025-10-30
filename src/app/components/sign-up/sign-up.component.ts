import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent {
  constructor(private router: Router) {}

  crearCuenta(): void {
    console.log('Crear cuenta');
  }

  entrar(): void {
    this.router.navigateByUrl('/login');
  }

  irATerminos(): void {
    this.router.navigateByUrl('/terminos-y-condiciones');
  }
}

