import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nota-debito-responsables',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nota-debito-responsables.component.html',
      styleUrl: './nota-debito-responsables.component.scss'
})
export class NotaDebitoResponsablesComponent { collapsed = true; }

