import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nota-remision-appendices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appendices.component.html',
      styleUrl: './appendices.component.scss'
})
export class NotaRemisionAppendicesComponent { collapsed = true; }

