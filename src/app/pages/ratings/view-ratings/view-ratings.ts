import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-view-ratings',
  imports: [DatePipe],
  templateUrl: './view-ratings.html',
  styleUrl: './view-ratings.css',
})
export class ViewRatings implements OnInit {
  usuarioId!: number;
  usuario: any = null;
  valoracionesRecibidas: any[] = [];
  cargando = true;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  irADetalleUsuario() {
    if (this.usuario && this.usuario.id) {
      this.router.navigate([`perfil/${this.usuario.id}`]);
    }
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.usuarioId = Number(params.get('id'));
      this.loadData();
    });
  }

  async loadData() {
    this.cargando = true;
    this.error = '';
    this.usuario = null;
    this.valoracionesRecibidas = [];
    try {
      const token = localStorage.getItem('tt_token');
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });

      // Obtener datos del usuario principal
      const userUrl = `${environment.apiUrl}/users/${this.usuarioId}`;
      this.usuario = await firstValueFrom(this.http.get(userUrl, { headers }));

      // Obtener valoraciones recibidas
      const ratingsUrl = `${environment.apiUrl}/ratings/rated_user/${this.usuarioId}`;
      const ratingsResponse: any = await firstValueFrom(
        this.http.get<any>(ratingsUrl, { headers })
      );
      const valoracionesArr: any[] = Array.isArray(ratingsResponse.results?.results)
        ? ratingsResponse.results.results
        : [];

      // Obtener datos completos de cada autor
      this.valoracionesRecibidas = await Promise.all(
        valoracionesArr.map(async (val) => {
          let author = { id: val.author_id, username: `Usuario ${val.author_id}`, image: '' };
          try {
            const authorData = await firstValueFrom(
              this.http.get(`${environment.apiUrl}/users/${val.author_id}`, { headers })
            );
            if (authorData) author = authorData as any;
          } catch (e) {}
          return {
            autor: author,
            puntuacion: val.score,
            comentario: val.comment,
            fecha: val.created_at,
          };
        })
      );
      this.cargando = false;
    } catch (err) {
      console.error('Error al cargar:', err);
      this.error = 'Error al cargar datos o valoraciones.';
      this.cargando = false;
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
