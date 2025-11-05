import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nota-remision-appendices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nota-remision-appendices.component.html',
      styleUrl: './nota-remision-appendices.component.scss'
})
export class NotaRemisionAppendicesComponent { collapsed = true; }

