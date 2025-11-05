import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nota-remision-responsables',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nota-remision-responsables.component.html',
      styleUrl: './nota-remision-responsables.component.scss'
})
export class NotaRemisionResponsablesComponent { collapsed = true; }

