import { Component, inject, signal, Input, SimpleChanges } from '@angular/core';
import { AuthService } from '../../core/services/auth';
import { Iuser } from '../../interfaces/iuser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

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
  constructor(private router: Router, private authService: AuthService) {}

  private route = inject(ActivatedRoute);

  usuarioValoracion: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario'] && this.usuario && this.usuario.id) {
      const token = localStorage.getItem('tt_token') || '';
      this.authService.getUserRating(this.usuario.id, token).subscribe({
        next: (rating: number) => {
          this.usuarioValoracion = rating;
        },
        error: (error) => {
          this.usuarioValoracion = null;
        },
      });
    }
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    const token = localStorage.getItem('tt_token') || '';
    try {
      if (id) {
        this.usuario = await this.authService.getUserById(Number(id));
      }

      // Normalizar intereses: siempre convertir a array
      if (this.usuario && typeof this.usuario.interests === 'string') {
        this.usuario.interests = this.usuario.interests.split(',').map((i: string) => i.trim());
        this.authService.getUserRating(this.usuario.id, token).subscribe({
          next: (rating: number) => {
            console.log('Valoración recibida:', rating);
            this.usuarioValoracion = rating;
          },
          error: (error) => {
            this.usuarioValoracion = null;
          },
        });
      }
    } catch (error) {
      console.log(error, 'ERROR AL OBTENER EL USUARIO');
    }
  }

  irAValoraciones() {
    if (this.usuario && this.usuario.id) {
      this.router.navigate([`valoraciones/${this.usuario.id}`]);
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
}
