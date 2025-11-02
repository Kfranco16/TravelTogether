import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CardViaje } from './components/card-viaje/card-viaje';
import { Login } from './pages/login/login';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CardViaje, Login],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('TravelTogether');
}
