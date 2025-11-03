import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CardViaje } from './components/card-viaje/card-viaje';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CardViaje, Login, Registro],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('TravelTogether');
}
