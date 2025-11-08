import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth';
import { Iuser } from '../../interfaces/iuser';
@Component({
  selector: 'app-perfil',
  imports: [],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil {
  userService = inject(AuthService);
  user: Iuser = {
    id: 0,
    username: '',
    email: '',
    image: '',
    phone: '',
    bio: '',
    interests: [],
    role: '',
    is_active: 0,
    created_at: '',
    updated_at: '',
  };

  /* async ngOnInit() {
    try {
      this.user = await this.userService.getUser(this.user);

      // Normalizar intereses: siempre convertir a array
      if (typeof this.user.interests === 'string') {
        this.user.interests = this.user.interests.split(',').map((i) => i.trim());
      }
    } catch (error) {
      console.log(error, 'ERROR AL OBTENER EL USUARIO');
    }
  } */
}
