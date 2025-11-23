import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, of, from } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { TripService } from '../../core/services/viajes';
import { ParticipationService } from '../../core/services/participations';
import { AuthService } from '../../core/services/auth';
import { RatingsService } from '../../core/services/ratings';
import { DatePipe } from '@angular/common';
import { CardUsuario } from '../../components/card-usuario/card-usuario';

@Component({
  selector: 'app-valoraciones-pendientes',
  templateUrl: './ratings.html',
  styleUrls: ['./ratings.css'],
  imports: [DatePipe, CardUsuario],
})
export class ValoracionesPendientesComponent implements OnInit {
  pendingRatings: any[] = [];
  userId!: number;

  modalRating: any = null;
  modalScore = 0;
  modalComment = '';

  constructor(
    private route: ActivatedRoute,
    private tripService: TripService,
    private participationService: ParticipationService,
    private authService: AuthService,
    private ratingsService: RatingsService
  ) {}

  getPendingRatings(userId: number, allTrips: any[]): any[] {
    const today = new Date();

    return allTrips
      .filter((trip) => trip.creator_id === userId && new Date(trip.end_date) < today)
      .map((trip) => ({
        tripId: trip.id,
        tripName: trip.title,
        destination: trip.destination,
        startDate: trip.start_date,
        endDate: trip.end_date,
        cost: trip.estimated_cost,
        imageUrl: trip.image_url,
        creator_id: {
          userId: trip.creator_id, // Si luego necesitas nombre/avatar, debes buscarlo
          username: trip.organizer_name, // Solo si la DB te lo da, o búscalo aparte
          avatarUrl: trip.organizer_img,
          isRated: false, // Solo puedes mejorar esto si tienes endpoint de valoraciones hechas
          rating: null,
        },
      }));
  }

  ngOnInit(): void {
    this.userId = Number(this.route.snapshot.paramMap.get('userId'));

    this.tripService.getAllTrips().subscribe((allTrips: any[]) => {
      this.pendingRatings = this.getPendingRatings(this.userId, allTrips);
      // Si quieres cargar compañeros después, aquí es el sitio
    });

    // Primero cargo todos los viajes donde el usuario es organizador

    from(this.tripService.getTripById(this.userId)).subscribe((allTrips) => {
      this.pendingRatings = this.getPendingRatings(this.userId, allTrips as any);
      // Si quieres, aquí puedes cargar compañeros y datos extra

      // Aquí podrías tener los tripIds desde otro endpoint, ejemplo:
      // this.tripService.getTripsForUser(this.userId).subscribe((tripIds: number[]) => {...});

      const tripIds = [1, 2]; // Simula los tripIds, reemplaza por consulta real
    });
  }

  // Modal helpers
  getEstrellas(valoracion: number): { icon: string; color: string }[] {
    const estrellas = [];
    for (let i = 1; i <= 5; i++) {
      estrellas.push({
        icon: i <= valoracion ? 'bi-star-fill' : 'bi-star',
        color: i <= valoracion ? 'text-warning' : 'text-secondary',
      });
    }
    return estrellas;
  }

  openModal(
    tripId: number,
    userId: number,
    username: string,
    avatarUrl: string,
    isOrganizer: boolean = false
  ) {
    this.modalRating = { tripId, userId, username, avatarUrl, isOrganizer };
    this.modalScore = 0;
    this.modalComment = '';
    setTimeout(() => {
      const modal = document.getElementById('valoracionModal');
      // @ts-ignore
      if (modal && window.bootstrap) window.bootstrap.Modal.getOrCreateInstance(modal).show();
    });
  }

  setModalScore(score: number) {
    this.modalScore = score;
  }

  setModalComment(event: Event) {
    const input = event.target as HTMLTextAreaElement;
    this.modalComment = input.value;
  }

  submitModalRating() {
    if (!this.modalRating) return;
    const { tripId, userId } = this.modalRating;
    this.ratingsService
      .createRating({
        trip_id: tripId,
        author_id: this.userId,
        rated_user_id: userId,
        score: this.modalScore,
        comment: this.modalComment,
      })
      .subscribe(() => {
        // Actualiza el estado local si quieres marcar como "ya valorado"
        const trip = this.pendingRatings.find((t) => t.tripId === tripId);
        if (trip) {
          if (this.modalRating.isOrganizer && trip.organizer.userId === userId) {
            trip.organizer.isRated = true;
            trip.organizer.rating = this.modalScore;
          } else {
            interface TripCompanion {
              userId: number;
              isRated: boolean;
              rating?: number;
            }
            const companion: TripCompanion | undefined = trip.companions?.find(
              (c: TripCompanion) => c.userId === userId
            );
            if (companion) {
              companion.isRated = true;
              companion.rating = this.modalScore;
            }
          }
        }
        // Cierra modal
        const modal = document.getElementById('valoracionModal');
        // @ts-ignore
        if (modal && window.bootstrap) window.bootstrap.Modal.getOrCreateInstance(modal).hide();
        this.modalRating = null;
      });
  }
}
