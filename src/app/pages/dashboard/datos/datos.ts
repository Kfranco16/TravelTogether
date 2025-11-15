import { Component } from '@angular/core';
import { Registro } from '../../registro/registro';

@Component({
  selector: 'app-datos',
  standalone: true,
  imports: [Registro],
  templateUrl: './datos.html',
  styleUrl: './datos.css',
})
export class Datos {
  // Texto específico para la página "Mis datos"
  tituloFormulario = 'Actualiza tu información personal';
  textoBoton = 'Guardar cambios';
}
