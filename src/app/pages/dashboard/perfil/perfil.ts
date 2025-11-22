import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth';
import { Iuser } from '../../../interfaces/iuser';

// Importamos el componente standalone de edición de perfil
import { EditarPerfil } from '../../editar-perfil/editar-perfil';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [EditarPerfil],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css'],
})
export class Perfil {
  private auth = inject(AuthService);

  user: Iuser | null = this.auth.getCurrentUser();
  defaultAvatar = 'https://i.pravatar.cc/120?u=traveltogether';

  // Control del modo edición
  editMode = false;

  activarEdicion() {
    this.editMode = true;
  }

  cerrarEdicion() {
    this.editMode = false;
  }
}
