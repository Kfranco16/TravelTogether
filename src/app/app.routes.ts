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
  //RUTAS PÚBLICAS (Accesibles por todos)
  {
    path: '',
    component: Landing,
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'registro',
    component: Registro,
  },
  {
    path: 'viajes',
    component: BuscadorViajes,
  },
  // RUTAS PRIVADAS (Requieren inicio de sesión)
  { path: 'viaje/:id', component: DetalleViaje, canActivate: [authGuard] },
  { path: 'crear-viaje', component: CrearEditarViaje, canActivate: [authGuard] },

  { path: 'perfil/:id', component: Perfil, canActivate: [authGuard] },
  {
    path: 'mis-valoraciones/:id',
    component: ValoracionesPendientesComponent,
    canActivate: [authGuard],
  },
  { path: 'valoraciones/:id', component: ViewRatings, canActivate: [authGuard] },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard], // PROTEGIDA: La ruta padre protege a todas las hijas.
    children: [
      // Aquí irán todas las páginas de gestión del usuario.
      // Por ejemplo:
      // { path: 'crear-viaje', component: CrearViajeComponent },
      // { path: 'editar-perfil', component: EditarPerfilComponent },
      // { path: 'gestionar/:viajeId', component: GestionarViajeComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
