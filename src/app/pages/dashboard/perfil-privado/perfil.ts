import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { FavoritesService } from '../../../core/services/favorites';
import { AuthService } from '../../../core/services/auth';
import { TripService } from '../../../core/services/viajes';
import { RatingsService } from '../../../core/services/ratings'; // <-- NUEVO
import { Iuser } from '../../../interfaces/iuser';

interface Rating {
  id: number;
  score: number;
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
  // Servicios
  private auth = inject(AuthService);
  private tripsService = inject(TripService);
  private route = inject(ActivatedRoute);
  private favorites = inject(FavoritesService);
  private ratingsService = inject(RatingsService); // <-- NUEVO

  constructor(private authService: AuthService, private router: Router) {}

  // Flags
  isOwnProfile = true;

  // Datos de usuario
  defaultAvatar = '/images/defaultUserImage.png';
  user: Iuser | null = null;

  // Valoraciones del usuario
  ratings: Rating[] = [];
  hasRatings = false;
  averageScore = 0;
  averageStars = 0;
  ratingCount = 0;
  usuarioValoracion: number | null = null;

  // Estrellas para bucle
  stars = [1, 2, 3, 4, 5];

  // Stats
  memberSince: string | null = null;
  tripsCount: number | null = null;
  favoritesCount: number | null = null;

  // Próximo viaje
  nextTrip: any | null = null;
  nextTripDestination: string | null = null;
  nextTripDate: string | null = null;
  daysToNextTrip: number | null = null;

  // Otros datos
  publicTagline = '';
  createdTrips: any[] = [];

  // Nº de valoraciones pendientes (venidas del servicio compartido)
  pendingRatingsCount = 0;

  // Ciclo de vida
  async ngOnInit(): Promise<void> {
    // Suscribirse al contador global de valoraciones pendientes
    this.ratingsService.pendingCount$.subscribe((count) => {
      this.pendingRatingsCount = count;
    });

    const current: any = this.auth.getCurrentUser();
    const paramId = this.route.snapshot.paramMap.get('id');

    if (!paramId) {
      // Perfil propio sin id en la URL
      if (current) {
        this.isOwnProfile = true;
        this.setupFromUser(current);
      } else {
        this.isOwnProfile = false;
        this.setupFromUser(null);
      }
    } else {
      // Perfil con id en la URL
      const viewedId = Number(paramId);

      if (current && current.id === viewedId) {
        this.isOwnProfile = true;
        this.setupFromUser(current);
      } else {
        this.isOwnProfile = false;
        try {
          const viewedUser = await this.auth.getUserById(viewedId);
          this.setupFromUser(viewedUser as any);
        } catch (error) {
          console.error('Error cargando usuario por id', error);
          this.setupFromUser(null);
        }
      }
    }

    // Nota: loadCreatedTrips también se llama en setupFromUser cuando hay user.id
    if (this.user?.id) {
      this.loadCreatedTrips(this.user.id);
    }
  }

  // Navegación
  goToValorarPage(): void {
    if (this.user && this.user.id) {
      this.router.navigate([`mis-valoraciones/${this.user.id}`]);
    }
  }

  goToEditProfile(): void {
    if (!this.user) return;
    this.router.navigate(['/dashboard/datos']);
  }

  goToFavoritesPage(): void {
    if (this.user && this.user.id) {
      this.router.navigate([`dashboard/favoritos/`]);
    }
  }

  irADetalleViaje(): void {
    if (this.nextTrip && this.nextTrip.id) {
      this.router.navigate([`/viaje/${this.nextTrip.id}`]);
    }
  }

  // Estrellas según valoración
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

  // Cargar número de favoritos
  private loadFavoritesCount(userId: number): void {
    const token = this.auth.gettoken() || '';
    this.favorites.getFavoritesByUser(userId, token).subscribe({
      next: (favorites) => {
        this.favoritesCount = favorites.length;
      },
      error: () => {
        this.favoritesCount = 0;
      },
    });
  }

  // Inicializar desde usuario (propio o visto)
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
      this.usuarioValoracion = null;
      return;
    }

    this.user = raw as Iuser;

    if (this.user?.id) {
      this.loadCreatedTrips(this.user.id);
      this.loadFavoritesCount(this.user.id);
    }

    // Valoración agregada del usuario
    const token = localStorage.getItem('tt_token') || '';
    this.auth.getUserRating(this.user.id, token).subscribe({
      next: (rating: number) => {
        this.usuarioValoracion = rating;
      },
      error: (error) => {
        if (error.status === 404) {
          this.usuarioValoracion = null;
        } else {
          console.error('Error obteniendo valoración en perfil:', error);
          this.usuarioValoracion = null;
        }
      },
    });

    // Valoraciones detalle (si vienen embebidas)
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

    // Stats básicas
    this.memberSince = raw.memberSince || raw.created_at || null;
    this.tripsCount = raw.tripsCount || raw.trips_count || null;
    this.favoritesCount = raw.favoritesCount || raw.favorites_count || null;

    // Próximo viaje (si el back lo manda precalculado)
    this.nextTripDestination = raw.nextTripDestination || null;
    this.nextTripDate = raw.nextTripDate || null;
    this.daysToNextTrip = typeof raw.daysToNextTrip === 'number' ? raw.daysToNextTrip : null;

    // Frase pública
    this.publicTagline = raw.public_tagline || raw.bio || '';
  }

  // Viajes creados por el usuario y cálculo de próximo viaje
  private loadCreatedTrips(userId: number): void {
    this.tripsService.getTripsByCreator(userId).subscribe({
      next: (res: any) => {
        this.createdTrips = res?.trips || res?.results || [];

        if (!this.tripsCount) {
          this.tripsCount = this.createdTrips.length;
        }

        this.calculateNextTrip();
      },
      error: (err: any) => {
        console.error('Error cargando viajes creados por el usuario', err);
      },
    });
  }

  private calculateNextTrip(): void {
    if (!this.createdTrips || this.createdTrips.length === 0) {
      this.nextTrip = null;
      this.nextTripDestination = null;
      this.nextTripDate = null;
      this.daysToNextTrip = null;
      return;
    }

    const today = new Date();

    const futureTrips = this.createdTrips
      .map((trip: any) => ({
        ...trip,
        startDate: new Date(trip.start_date || trip.startDate),
      }))
      .filter((t: any) => t.startDate.getTime() > today.getTime());

    if (futureTrips.length === 0) {
      this.nextTrip = null;
      this.nextTripDestination = null;
      this.nextTripDate = null;
      this.daysToNextTrip = null;
      return;
    }

    futureTrips.sort((a: any, b: any) => a.startDate.getTime() - b.startDate.getTime());

    const next = futureTrips[0];
    this.nextTrip = next;

    this.nextTripDestination = next.destination || next.city || next.title || 'Próximo viaje';
    this.nextTripDate = next.startDate.toISOString();

    const diffMs = next.startDate.getTime() - today.getTime();
    this.daysToNextTrip = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  // Tagline (actualmente solo actualiza estado local)
  onTaglineInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.publicTagline = input.value;
  }

  // Foto de perfil
  onDeletePhoto(): void {
    if (!this.isOwnProfile || !this.user) return;

    const confirmed = window.confirm('¿Seguro que quieres eliminar tu foto de perfil?');
    if (!confirmed) return;

    this.auth
      .updateUser(this.user.id, {
        username: this.user.username,
        email: this.user.email,
        image: '',
        phone: this.user.phone,
        bio: this.user.bio,
        interests: this.user.interests,
      })
      .then((updated) => {
        this.user = updated;
      })
      .catch((err) => {
        console.error('Error eliminando foto de usuario', err);
      });
  }

  onUploadPhoto(event: Event): void {
    if (!this.isOwnProfile || !this.user) return;

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.tripsService
      .uploadUserImage(file, this.user.id)
      .then(async (res) => {
        const newUrl = res?.data?.url;
        if (!newUrl) return;

        const updated = await this.auth.updateUser(this.user!.id, {
          username: this.user!.username,
          email: this.user!.email,
          image: newUrl,
          phone: this.user!.phone,
          bio: this.user!.bio,
          interests: this.user!.interests,
        });

        this.user = updated;
      })
      .catch((err) => {
        console.error('Error subiendo foto de usuario', err);
      });
  }
}
