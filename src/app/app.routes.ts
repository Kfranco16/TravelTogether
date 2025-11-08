import { Routes } from '@angular/router';
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
import { Registro } from './pages/registro/registro';
import { DetalleViaje } from './pages/detalle-viaje/detalle-viaje';
import { Perfil } from './pages/perfil/perfil';

export const routes: Routes = [
  { path: 'registro', component: Registro },
  { path: 'detalle-viaje', component: DetalleViaje },
  { path: 'perfil', component: Perfil },
>>>>>>> origin/develop
];
