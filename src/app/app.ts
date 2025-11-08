import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CardViaje } from './components/card-viaje/card-viaje';

import { Header } from './shared/components/header/header';
import { Footer } from './shared/components/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  protected readonly title = signal('TravelTogether');
}
