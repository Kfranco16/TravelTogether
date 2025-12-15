import { Component } from '@angular/core';

@Component({
  selector: 'app-reservas',
  standalone: true,
  templateUrl: './reservas.html',
  styleUrls: ['./reservas.css'],
})
export class Reservas {
  //Implementación de Mi Espacio
  cargando = false;
  reservas: Array<{ id: number; viaje: string; salida: string }> = [];
}
