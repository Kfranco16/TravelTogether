import { Routes } from '@angular/router';
import { Registro } from './pages/registro/registro';
import { DetalleViaje } from './pages/detalle-viaje/detalle-viaje';
import { Perfil } from './pages/perfil/perfil';

export const routes: Routes = [
  { path: 'registro', component: Registro },
  { path: 'detalle-viaje', component: DetalleViaje },
  { path: 'perfil', component: Perfil },
];
