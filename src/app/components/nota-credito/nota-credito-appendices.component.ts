import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nota-credito-appendices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nota-credito-appendices.component.html',
      styleUrl: './nota-credito-appendices.component.scss'
})
export class NotaCreditoAppendicesComponent { collapsed = true; }

