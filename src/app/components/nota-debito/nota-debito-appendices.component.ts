import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nota-debito-appendices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nota-debito-appendices.component.html',
      styleUrl: './nota-debito-appendices.component.scss'
})
export class NotaDebitoAppendicesComponent { collapsed = true; }

