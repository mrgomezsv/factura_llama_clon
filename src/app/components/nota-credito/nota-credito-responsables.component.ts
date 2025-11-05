import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nota-credito-responsables',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nota-credito-responsables.component.html',
      styleUrl: './nota-credito-responsables.component.scss'
})
export class NotaCreditoResponsablesComponent { collapsed = true; }

