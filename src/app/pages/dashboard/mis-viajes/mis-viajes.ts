import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mis-viajes',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './mis-viajes.html',
  styleUrls: ['./mis-viajes.css'],
})
export class MisViajes {
  cargando = false;
  viajes: Array<{ id: number; titulo: string }> = [];
}
