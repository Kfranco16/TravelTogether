import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/services/auth';
import { TripService } from '../../../core/services/viajes';
import { Iuser } from '../../../interfaces/iuser';
import { CardViaje } from '../../../components/card-viaje/card-viaje';

interface Rating {
  id: number;
  score: number; // 1–5
  comment: string;
  from: string;
  createdAt: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css'],
})
export class Perfil {
  private auth = inject(AuthService);
  private tripsService = inject(TripService);
  private route = inject(ActivatedRoute);

  // Para saber si estamos viendo nuestro propio perfil o el de otro usuario
  isOwnProfile = true;

  // Avatar por defecto
  defaultAvatar =
    'https://st3.depositphotos.com/8214686/37640/i/450/depositphotos_376406240-stock-photo-couple-hikers-with-backpack-on.jpg';

  // Usuario actual (o usuario que estamos viendo)
  user: Iuser | null = null;

  // Valoraciones del usuario
  ratings: Rating[] = [];
  hasRatings = false;
  averageScore = 0;
  averageStars = 0;
  ratingCount = 0;

  // Array para pintar las 5 estrellas en el template
  stars = [1, 2, 3, 4, 5];

  // Stats
  memberSince: string | null = null;
  tripsCount: number | null = null;
  favoritesCount: number | null = null;

  // Siguiente viaje (solo propio)
  nextTripDestination: string | null = null;
  nextTripDate: string | null = null;
  daysToNextTrip: number | null = null;

  // Frase pública que ven otros usuarios
  publicTagline = '';

  // Viajes creados por este usuario (para mostrar abajo en cards)
  createdTrips: any[] = [];

  async ngOnInit(): Promise<void> {
    const current: any = this.auth.getCurrentUser();
    const paramId = this.route.snapshot.paramMap.get('id');

    if (!paramId) {
      // Ruta sin id → siempre es tu propio perfil
      this.isOwnProfile = true;
      this.setupFromUser(current);
    } else {
      const viewedId = Number(paramId);

      if (current && current.id === viewedId) {
        // Estás viendo tu propio perfil por URL con id
        this.isOwnProfile = true;
        this.setupFromUser(current);
      } else {
        // Perfil público de otro usuario
        this.isOwnProfile = false;
        try {
          const viewedUser = await this.auth.getUserById(viewedId);
          this.setupFromUser(viewedUser as any);
        } catch (error) {
          console.error('Error cargando usuario por id', error);
        }
      }
    }

    // Si después de todo no tenemos usuario, mejor no intentar cargar viajes
    if (this.user?.id) {
      this.loadCreatedTrips(this.user.id);
    }
  }

  // Inicializa todas las propiedades a partir de un objeto de usuario
  private setupFromUser(raw: any | null | undefined): void {
    if (!raw) {
      this.user = null;
      this.ratings = [];
      this.hasRatings = false;
      this.averageScore = 0;
      this.averageStars = 0;
      this.ratingCount = 0;
      this.memberSince = null;
      this.tripsCount = null;
      this.favoritesCount = null;
      this.nextTripDestination = null;
      this.nextTripDate = null;
      this.daysToNextTrip = null;
      this.publicTagline = '';
      return;
    }

    this.user = raw;

    // Valoraciones
    if (raw.ratings && Array.isArray(raw.ratings)) {
      this.ratings = raw.ratings;
    } else {
      this.ratings = [];
    }

    this.hasRatings = this.ratings.length > 0;

    if (this.hasRatings) {
      const sum = this.ratings.reduce((acc, r) => acc + r.score, 0);
      this.averageScore = sum / this.ratings.length;
      this.averageStars = Math.round(this.averageScore);
      this.ratingCount = this.ratings.length;
    } else {
      this.averageScore = 0;
      this.averageStars = 0;
      this.ratingCount = 0;
    }

    // Stats básicas (si el back las da)
    this.memberSince = raw.memberSince || raw.created_at || null;
    this.tripsCount = raw.tripsCount || raw.trips_count || null;
    this.favoritesCount = raw.favoritesCount || raw.favorites_count || null;

    // Próximo viaje (opcional, solo tendrá sentido para el propio perfil)
    this.nextTripDestination = raw.nextTripDestination || null;
    this.nextTripDate = raw.nextTripDate || null;
    this.daysToNextTrip = typeof raw.daysToNextTrip === 'number' ? raw.daysToNextTrip : null;

    // Frase pública
    this.publicTagline = raw.public_tagline || raw.bio || '';
  }

  // Cargar viajes creados por este usuario
  private loadCreatedTrips(userId: number): void {
    this.tripsService.getTripsByCreator(userId).subscribe({
      next: (res: any) => {
        // En mis-viajes el back devuelve { total, trips, ... }
        this.createdTrips = res?.trips || res?.results || [];
        if (!this.tripsCount) {
          this.tripsCount = this.createdTrips.length;
        }
      },
      error: (err: any) => {
        console.error('Error cargando viajes creados por el usuario', err);
      },
    });
  }

  // Cuando el usuario escribe en el input de la frase pública
  onTaglineInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.publicTagline = input.value;
    // más adelante haremos la llamada a la API para guardar cambios
  }

  // Eliminar foto (solo propio)
  onDeletePhoto(): void {
    if (!this.isOwnProfile) return;
    console.log('Eliminar foto… (implementar llamada a la API)');
  }

  // Subir foto (solo propio)
  onUploadPhoto(event: Event): void {
    if (!this.isOwnProfile) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    console.log('Subir foto… (implementar subida de imagen)', file.name);
  }
}
