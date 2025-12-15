import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { FavoritesService } from '../../../core/services/favorites';
import { AuthService } from '../../../core/services/auth';
import { TripService } from '../../../core/services/viajes';
import { RatingsService } from '../../../core/services/ratings';
import { Iuser } from '../../../interfaces/iuser';
import { NotificationsService, NotificationDto } from '../../../core/services/notifications';
import { ParticipationService } from '../../../core/services/participations';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, RouterLink],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css'],
})
export class Perfil {
  private auth = inject(AuthService);
  private tripsService = inject(TripService);
  private participationService = inject(ParticipationService);
  private favorites = inject(FavoritesService);
  private ratingsService = inject(RatingsService);
  private notificationsService = inject(NotificationsService);
  private router = inject(Router);

  user: Iuser | null = null;
  defaultAvatar = '/images/defaultUserImage.png';

  usuarioValoracion: number | null = null;
  stars = [1, 2, 3, 4, 5];

  tripsCount: number = 0;

  organizerTripsCount: number = 0;

  completedTripsCount: number = 0;

  pendingTripsCount: number = 0;
  pendingToDoTripsCount: number = 0;

  favoritesCount: number | null = null;

  createdTrips: any[] = [];
  nextTrip: any | null = null;
  nextTripDestination: string | null = null;
  nextTripDate: string | null = null;
  daysToNextTrip: number | null = null;

  pendingRatingsCount = 0;
  ratingsReceivedCount: number = 0;
  ratingsGivenCount: number = 0;

  portadaImageUrl: string = 'images/coverDefault.jpg';
  portadaImageAlt: string = 'Imagen de portada';

  realNextTripImage?: string | null = null;

  hasNotifications = false;
  notificaciones: NotificationDto[] = [];
  notif = {
    perfil: false,
    datos: false,
    reservas: false,
    misViajes: false,
    favoritos: false,
    notificaciones: false,
    foros: false,
  };

  showDeletePhotoModal = false;

  async ngOnInit(): Promise<void> {
    this.ratingsService.pendingCount$.subscribe((count) => {
      this.pendingRatingsCount = count;
    });

    const current = this.auth.getCurrentUser() as Iuser | null;
    if (!current) {
      this.router.navigate(['/home']);
      return;
    }

    await this.loadLoggedUserData(current.id);

    this.cargarNotificaciones();
  }

  private async loadLoggedUserData(userId: number): Promise<void> {
    this.tripsCount = 0;
    this.favoritesCount = 0;
    this.createdTrips = [];
    this.nextTrip = null;
    this.nextTripDestination = null;
    this.nextTripDate = null;
    this.daysToNextTrip = null;
    this.organizerTripsCount = 0;
    this.completedTripsCount = 0;
    this.pendingTripsCount = 0;
    this.loadUserRating(userId);
    this.loadFavoritesCount(userId);
    this.loadCreatedTrips(userId);
    this.loadRatingsStats(userId);

    try {
      const fullUser = await this.auth.getUserById(userId);
      if (!fullUser) {
        this.router.navigate(['/home']);
        return;
      }

      this.user = fullUser as Iuser;

      this.loadUserRating(this.user.id);
      this.loadFavoritesCount(this.user.id);
      this.loadCreatedTrips(this.user.id);

      this.tripsCount =
        (fullUser as any).tripsCount || (fullUser as any).trips_count || this.tripsCount;
      this.favoritesCount =
        (fullUser as any).favoritesCount ||
        (fullUser as any).favorites_count ||
        this.favoritesCount;
    } catch (error) {
      console.error('Error cargando usuario logueado con getUserById', error);
      this.router.navigate(['/home']);
    }
  }

  private loadRatingsStats(userId: number): void {
    const token = this.auth.gettoken() || '';
    if (!token) {
      this.ratingsReceivedCount = 0;
      this.ratingsGivenCount = 0;
      return;
    }

    this.ratingsService.getRatingsByRatedUser(userId).subscribe({
      next: (received) => {
        this.ratingsReceivedCount = received?.length ?? 0;
      },
      error: () => {
        this.ratingsReceivedCount = 0;
      },
    });

    this.ratingsService.getRatingsByAuthor(userId).subscribe({
      next: (given) => {
        this.ratingsGivenCount = given?.length ?? 0;
      },
      error: () => {
        this.ratingsGivenCount = 0;
      },
    });
  }

  private loadUserRating(userId: number): void {
    const token = this.auth.gettoken() || '';
    if (!token) {
      this.usuarioValoracion = null;
      return;
    }

    this.auth.getUserRating(userId, token).subscribe({
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
  }

  private loadFavoritesCount(userId: number): void {
    const token = this.auth.gettoken() || '';
    if (!token) {
      this.favoritesCount = 0;
      return;
    }

    this.favorites.getFavoritesByUser(userId, token).subscribe({
      next: (favorites) => {
        this.favoritesCount = favorites.length;
      },
      error: () => {
        this.favoritesCount = 0;
      },
    });
  }

  private loadCreatedTrips(userId: number): void {
    this.participationService.getMyParticipations().subscribe({
      next: (res: any) => {
        this.createdTrips = res?.data || [];

        this.tripsCount = this.createdTrips.length;

        const today = new Date();

        this.pendingToDoTripsCount = this.createdTrips.filter((trip: any) => {
          const start = new Date(trip.start_date || trip.startDate);
          return start.getTime() > today.getTime();
        }).length;

        this.completedTripsCount = this.createdTrips.filter((trip: any) => {
          if (trip.status !== 'accepted' || !trip.end_date) return false;
          const end = new Date(trip.end_date);
          return end.getTime() < today.getTime();
        }).length;

        this.organizerTripsCount = this.createdTrips.filter(
          (trip: any) => trip.creator_id === userId
        ).length;

        this.pendingTripsCount = this.createdTrips.filter(
          (trip: any) => trip.status === 'pending'
        ).length;

        this.calculateNextTrip();
      },
      error: (err: any) => {
        console.error('Error cargando mis viajes (participaciones)', err);
        this.createdTrips = [];
        this.tripsCount = 0;
        this.completedTripsCount = 0;
        this.organizerTripsCount = 0;
        this.pendingTripsCount = 0;
        this.calculateNextTrip();
      },
    });
  }

  private calculateNextTrip(): void {
    if (!this.createdTrips || this.createdTrips.length === 0) {
      this.nextTrip = null;
      this.nextTripDestination = null;
      this.nextTripDate = null;
      this.daysToNextTrip = null;
      this.portadaImageUrl = 'images/coverDefault.jpg';
      this.portadaImageAlt = 'Imagen de portada';
      return;
    }

    const today = new Date();

    const acceptedTrips = this.createdTrips.filter((trip: any) => trip.status === 'accepted');

    const futureTrips = acceptedTrips
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
      this.portadaImageUrl = 'images/coverDefault.jpg';
      this.portadaImageAlt = 'Imagen de portada';
      return;
    }

    futureTrips.sort((a: any, b: any) => a.startDate.getTime() - b.startDate.getTime());

    const next = futureTrips[0];
    this.nextTrip = next;

    this.nextTripDestination = next.destination || next.trip_name || next.origin || 'Próximo viaje';
    this.nextTripDate = next.startDate.toISOString();

    const diffMs = next.startDate.getTime() - today.getTime();
    this.daysToNextTrip = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    this.portadaImageUrl = next.trip_image_url || 'images/coverDefault.jpg';
    this.portadaImageAlt = next.trip_name || next.destination || 'Imagen de portada';
  }

  private cargarImagenes(tripId: number): void {
    this.tripsService.getImagesByTripId(tripId).subscribe({
      next: (data: any) => {
        const fotos: any[] = data?.results?.results || [];
        const fotoPortada = fotos.find((f) => f.main_img == '0' || f.main_img == 0);

        this.portadaImageUrl = fotoPortada?.url || 'images/coverDefault.jpg';
        this.portadaImageAlt = fotoPortada?.description || 'Imagen de portada';
      },
      error: () => {
        this.portadaImageUrl = 'images/coverDefault.jpg';
        this.portadaImageAlt = 'Imagen de portada';
      },
    });
  }

  public goToSection(section: keyof typeof this.notif, path: string): void {
    this.onSectionOpen(section);
    this.router.navigate([path]);
  }

  private resetFlags(): void {
    this.notif = {
      perfil: false,
      datos: false,
      reservas: false,
      misViajes: false,
      favoritos: false,
      notificaciones: false,
      foros: false,
    };
    this.hasNotifications = false;
  }

  private actualizarFlagsDesdeNotifications(): void {
    this.resetFlags();
    if (this.notificaciones.length === 0) return;

    for (const n of this.notificaciones) {
      switch (n.type) {
        case 'message':
          this.notif.foros = true;
          break;
        case 'trip':
          this.notif.misViajes = true;
          break;
        case 'favorites':
          this.notif.favoritos = true;
          break;
        case 'group':
          this.notif.reservas = true;
          break;
      }
    }

    this.notif.notificaciones = true;
    this.hasNotifications = Object.values(this.notif).some((v) => v);
  }

  private cargarNotificaciones(): void {
    const token = this.auth.gettoken() || '';
    const currentUser = this.auth.getCurrentUser() as Iuser | null;

    if (!token || !currentUser) {
      this.resetFlags();
      return;
    }

    this.notificationsService.getAll(token).subscribe({
      next: (list) => {
        this.notificaciones = list.filter(
          (n) => n.receiver_id === currentUser.id && n.is_read === 0
        );
        this.actualizarFlagsDesdeNotifications();
      },
      error: (err) => {
        console.error('Error cargando notificaciones', err);
        this.notificaciones = [];
        this.resetFlags();
      },
    });
  }

  onSectionOpen(section: keyof typeof this.notif): void {
    const token = this.auth.gettoken() || '';
    if (!token) {
      this.notif[section] = false;
      this.hasNotifications = Object.values(this.notif).some((v) => v);
      return;
    }

    if (section === 'misViajes' && this.notificaciones.length > 0) {
      const toDelete = this.notificaciones.filter((n) => n.type === 'trip' || n.type === 'group');
      if (toDelete.length === 0) {
        this.notif[section] = false;
        this.hasNotifications = Object.values(this.notif).some((v) => v);
        return;
      }

      toDelete.forEach((n) => {
        this.notificationsService.delete(n.id, token).subscribe({
          next: () => {
            this.notificaciones = this.notificaciones.filter((x) => x.id !== n.id);
            this.actualizarFlagsDesdeNotifications();
          },
          error: (err) => console.error('Error eliminando notificación de tipo trip/group', err),
        });
      });
    } else if (section === 'foros' && this.notificaciones.length > 0) {
      const toDelete = this.notificaciones.filter((n) => n.type === 'message');
      if (toDelete.length === 0) {
        this.notif[section] = false;
        this.hasNotifications = Object.values(this.notif).some((v) => v);
        return;
      }

      toDelete.forEach((n) => {
        this.notificationsService.delete(n.id, token).subscribe({
          next: () => {
            this.notificaciones = this.notificaciones.filter((x) => x.id !== n.id);
            this.actualizarFlagsDesdeNotifications();
          },
          error: (err) => console.error('Error eliminando notificación de tipo message', err),
        });
      });
    } else {
      if (this.notif[section]) {
        this.notif[section] = false;
        this.hasNotifications = Object.values(this.notif).some((v) => v);
      }
    }
  }

  goToValorarPage(): void {
    if (this.user && this.user.id) {
      this.router.navigate([`mis-valoraciones/${this.user.id}`]);
    }
  }

  onLogout(): void {
    this.auth.logout();
    this.router.navigate(['/home']);
  }

  goToEditProfile(): void {
    this.router.navigate(['/dashboard/editar-perfil']);
  }

  goToFavoritesPage(): void {
    this.router.navigate(['dashboard/favoritos']);
  }

  irADetalleViaje(): void {
    if (this.nextTrip && this.nextTrip.trip_id) {
      this.router.navigate([`/viaje/${this.nextTrip.trip_id}`]);
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

  openDeletePhotoModal(): void {
    if (!this.user) return;
    this.showDeletePhotoModal = true;
  }

  cancelDeletePhoto(): void {
    this.showDeletePhotoModal = false;
  }

  confirmDeletePhoto(): void {
    if (!this.user) {
      this.showDeletePhotoModal = false;
      return;
    }

    this.auth
      .updateUser(this.user.id, {
        username: this.user.username,
        email: this.user.email,
        image: '',
        phone: this.user.phone,
        bio: this.user.bio,
        interests: this.user.interests,
      })
      .then(async (updated) => {
        this.user = updated;
        this.showDeletePhotoModal = false;
        const fullUser = await this.auth.getUserById(this.user!.id);
        this.user = fullUser as Iuser;
        this.showDeletePhotoModal = false;
      })
      .catch((err) => {
        console.error('Error eliminando foto de usuario', err);
        this.showDeletePhotoModal = false;
      });
  }

  onUploadPhoto(event: Event): void {
    if (!this.user) return;

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
      .then(async () => {
        const fullUser = await this.auth.getUserById(this.user!.id);
        this.user = fullUser as Iuser;
        this.showDeletePhotoModal = false;
      })
      .catch((err) => {
        console.error('Error subiendo foto de usuario', err);
      });
  }
}
