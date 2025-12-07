import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { BuscadorViajes } from './pages/buscador-viajes/buscador-viajes';
import { authGuard } from './core/guards/auth-guard';
import { DetalleViaje } from './pages/detalle-viaje/detalle-viaje';
import { Perfil } from './pages/perfil/perfil';
import { Dashboard } from './pages/dashboard/dashboard';
import { CrearEditarViaje } from './pages/crear-editar-viaje/crear-editar-viaje';
import { ValoracionesPendientesComponent } from './pages/ratings/ratings';
import { ViewRatings } from './pages/ratings/view-ratings/view-ratings';

export const routes: Routes = [
  // RUTAS PÚBLICAS
  { path: '', component: Landing },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'viajes', component: BuscadorViajes },

  // RUTAS PRIVADAS (requieren login)
  { path: 'viaje/:id', component: DetalleViaje, canActivate: [authGuard] },
  { path: 'crear-viaje', component: CrearEditarViaje, canActivate: [authGuard] },
  { path: 'perfil/:id', component: Perfil, canActivate: [authGuard] },

  // MI ESPACIO (Dashboard con rutas hijas)
  {
    path: 'mis-valoraciones/:id',
    component: ValoracionesPendientesComponent,
    canActivate: [authGuard],
  },
  { path: 'valoraciones/:id', component: ViewRatings, canActivate: [authGuard] },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'perfil', pathMatch: 'full' },

      {
        path: 'perfil',
        loadComponent: () => import('./pages/dashboard/perfil/perfil').then((m) => m.Perfil),
      },
      {
        path: 'datos',
        loadComponent: () => import('./pages/dashboard/datos/datos').then((m) => m.Datos),
      },
      {
        path: 'reservas',
        loadComponent: () => import('./pages/dashboard/reservas/reservas').then((m) => m.Reservas),
      },
      {
        path: 'mis-viajes',
        loadComponent: () =>
          import('./pages/dashboard/mis-viajes/mis-viajes').then((m) => m.MisViajes),
      },
      {
        path: 'favoritos',
        loadComponent: () =>
          import('./pages/dashboard/favoritos/favoritos').then((m) => m.Favoritos),
      },
      {
        path: 'foros',
        loadComponent: () => import('./pages/dashboard/foros/foros').then((m) => m.Foros),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
