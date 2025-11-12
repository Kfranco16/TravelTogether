import { Component, inject, signal, Input } from '@angular/core';
import { AuthService } from '../../core/services/auth';
import { Iuser } from '../../interfaces/iuser';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-perfil',
  imports: [],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil {
  /*  route = inject(ActivatedRoute); */
  // @Input() id: number = 0;
  // userService = inject(AuthService);
  // user: Iuser = {
  //   id: 0,
  //   username: '',
  //   email: '',
  //   image: '',
  //   phone: '',
  //   bio: '',
  //   interests: [],
  //   role: '',
  //   is_active: 0,
  //   created_at: '',
  //   updated_at: '',
  // };

  usuario: Iuser | null = null;
  constructor(private route: ActivatedRoute, private authService: AuthService) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    try {
      if (id) {
        this.usuario = await this.authService.getUserById(Number(id));
      }

      // Normalizar intereses: siempre convertir a array
      if (this.usuario && typeof this.usuario.interests === 'string') {
        this.usuario.interests = this.usuario.interests.split(',').map((i: string) => i.trim());
      }
    } catch (error) {
      console.log(error, 'ERROR AL OBTENER EL USUARIO');
    }
  }
  getEstrellas(valoracion: number): { icon: string; color: string }[] {
    if (valoracion <= 2) {
      return [
        { icon: 'bi-star-fill', color: 'text-danger' },
        { icon: 'bi-star', color: 'text-secondary' },
        { icon: 'bi-star', color: 'text-secondary' },
      ];
    } else if (valoracion <= 3) {
      return [
        { icon: 'bi-star-fill', color: 'text-warning' },
        { icon: 'bi-star', color: 'text-secondary' },
        { icon: 'bi-star', color: 'text-secondary' },
      ];
    } else if (valoracion <= 4) {
      return [
        { icon: 'bi-star-fill', color: 'text-warning' },
        { icon: 'bi-star-fill', color: 'text-warning' },
        { icon: 'bi-star', color: 'text-secondary' },
      ];
    } else {
      return [
        { icon: 'bi-star-fill', color: 'text-warning' },
        { icon: 'bi-star-fill', color: 'text-warning' },
        { icon: 'bi-star-fill', color: 'text-warning' },
      ];
    }
  }
  usuarioProvisional = [{ valoracion: 4.2 }];
}
