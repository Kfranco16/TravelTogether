import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth-guard';

// Páginas públicas
import { BuscadorViajes } from './pages/buscador-viajes/buscador-viajes';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';

// Páginas protegidas
import { CrearEditarViaje } from './pages/crear-editar-viaje/crear-editar-viaje';
import { Dashboard } from './pages/dashboard/dashboard';

export const routes: Routes = [
  { path: '', redirectTo: 'buscar', pathMatch: 'full' },

  // Públicas
  { path: 'buscar', component: BuscadorViajes },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },

  // Protegidas
  { path: 'crear', canActivate: [authGuard], component: CrearEditarViaje },
  { path: 'dashboard', canActivate: [authGuard], component: Dashboard },

  { path: '**', redirectTo: 'buscar' },
];
