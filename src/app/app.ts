import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from './shared/components/header/header';
import { Footer } from './shared/components/footer/footer';
import { NgxSonnerToaster } from 'ngx-sonner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, NgxSonnerToaster],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  protected readonly title = signal('TravelTogether');
}
