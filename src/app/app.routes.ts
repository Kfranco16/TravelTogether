import { Routes } from '@angular/router';
import { searchearchComponent } from './pages/search/search';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';

export const routes: Routes = [
  { path: '', component: SearchComponent },
  { path: 'buscar', component: SearchComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: '**', redirectTo: 'buscar' },
];
