import { Routes } from '@angular/router';
import { SearchComponent } from './pages/search/search';
import { LoginComponent } from './pages/loging/loging';
import { RegisterComponent } from './pages/register/register';

export const routes: Routes = [
  { path: '', component: SearchComponent },
  { path: ' buscar', component: SearchComponent },
  { path: 'login', component: LogingComponent },
  { path: 'registro', component: registroComponent },
  { path: '**', redirectTo: 'buscar' },
];
