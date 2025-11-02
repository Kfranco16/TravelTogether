import { Routes } from '@angular/router';

import { Search } from './pages/search/search';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';

export const routes: Routes = [
  { path: '', component: Search },
  { path: 'buscar', component: Search },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: '**', redirectTo: 'buscar' },
];
