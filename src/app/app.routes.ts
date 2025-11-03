import { Routes } from '@angular/router';
import { Registro } from './pages/registro/registro';
import { DetalleViaje } from './pages/detalle-viaje/detalle-viaje';

export const routes: Routes = [
  { path: 'registro', component: Registro },
  { path: 'detalle-viaje', component: DetalleViaje },
];
