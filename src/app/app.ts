import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CardViaje } from './components/card-viaje/card-viaje';
import { CardUsuario } from './components/card-usuario/card-usuario';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CardViaje, CardUsuario],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('TravelTogether');
}
