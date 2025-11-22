import { Component } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink],
  templateUrl: './favoritos.html',
  styleUrls: ['./favoritos.css'],
})
export class Favoritos {
  cargando = false;
  favoritos: Array<{ id: number; titulo: string }> = [];
}
