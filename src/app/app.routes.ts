import { Routes } from '@angular/router';
<<<<<<< HEAD
<<<<<<< HEAD
import { SearchComponent } from './pages/search/search';
import { LoginComponent } from './pages/loging/loging';
import { RegisterComponent } from './pages/register/register';

export const routes: Routes = [
  { path: '', component: SearchComponent },
  { path: ' buscar', component: SearchComponent },
  { path: 'login', component: LogingComponent },
  { path: 'registro', component: registroComponent },
  { path: '**', redirectTo: 'buscar' },
=======
=======
import { Landing } from './pages/landing/landing';
import { Login } from './pages/login/login';
>>>>>>> origin/develop
import { Registro } from './pages/registro/registro';
import { BuscadorViajes } from './pages/buscador-viajes/buscador-viajes';
/* import { authGuard } from './guards/auth.guard'; */
import { DetalleViaje } from './pages/detalle-viaje/detalle-viaje';
import { Perfil } from './pages/perfil/perfil';
import { Dashboard } from './pages/dashboard/dashboard';

export const routes: Routes = [
<<<<<<< HEAD
  { path: 'registro', component: Registro },
  { path: 'detalle-viaje', component: DetalleViaje },
  { path: 'perfil', component: Perfil },
>>>>>>> origin/develop
=======
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
  { path: 'viaje/:id', component: DetalleViaje /*  canActivate: [authGuard] */ },

  { path: 'perfil/:id', component: Perfil /* canActivate: [authGuard] */ },
  {
    path: 'dashboard',
    component: Dashboard,
    /* canActivate: [authGuard] */ // PROTEGIDA: La ruta padre protege a todas las hijas.
    children: [
      // Aquí irán todas las páginas de gestión del usuario.
      // Por ejemplo:
      // { path: 'crear-viaje', component: CrearViajeComponent },
      // { path: 'editar-perfil', component: EditarPerfilComponent },
      // { path: 'gestionar/:viajeId', component: GestionarViajeComponent },
    ],
  },
  { path: '**', redirectTo: '' },
>>>>>>> origin/develop
];
