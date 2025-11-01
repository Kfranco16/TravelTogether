import { Routes } from '@angular/router';
<<<<<<< HEAD
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
=======

export const routes: Routes = [];
>>>>>>> parent of b89f2f2 (corrección app.routes.ts)
