import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ParticipationService } from '../../core/services/participations';
import { RatingsService } from '../../core/services/ratings';
import { AuthService } from '../../core/services/auth';
import { TripRatingCardComponent } from '../../components/trip-rating-card/trip-rating-card';

interface TripUser {
  userId: number;
  username: string;
  avatarUrl: string;
  isRated: boolean;
  rating: number | null;
}

interface TripRatingCard {
  tripId: number;
  tripName: string;
  destination: string;
  startDate: string;
  endDate: string;
  cost: number;
  imageUrl: string;
  organizer: TripUser;
  companions: TripUser[];
}

@Component({
  selector: 'app-valoraciones-pendientes',
  standalone: true,
  templateUrl: './ratings.html',
  styleUrls: ['./ratings.css'],
  imports: [DatePipe, TripRatingCardComponent],
})
export class ValoracionesPendientesComponent implements OnInit {
  pendingRatings: TripRatingCard[] = [];
  upcomingRatings: TripRatingCard[] = [];
  currentUserId!: number;

  modalRating: {
    tripId: number;
    userId: number;
    username: string;
    avatarUrl: string;
    isOrganizer: boolean;
  } | null = null;

  modalScore = 0;
  modalComment = '';

  constructor(
    private participationService: ParticipationService,
    private ratingsService: RatingsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const currentUser: { id: number; username?: string; image_url?: string } | null =
      this.authService.getCurrentUser();

    if (!currentUser) {
      console.error('No hay usuario autenticado');
      return;
    }
    this.currentUserId = currentUser.id;
    const userId = currentUser.id;

    forkJoin({
      createdResp: this.participationService
        .getMyCreatedTrips()
        .pipe(catchError(() => of({ data: [] }))),
      joinedResp: this.participationService
        .getMyParticipations()
        .pipe(catchError(() => of({ data: [] }))),
    })
      .pipe(
        map(({ createdResp, joinedResp }: any) => {
          const created = createdResp.data ?? [];
          const joined = joinedResp.data ?? [];

          const createdCards: TripRatingCard[] = created.map((t: any) =>
            this.mapCreatedTripToCard(t, currentUser)
          );
          const joinedCards: TripRatingCard[] = joined.map((t: any) => this.mapJoinedTripToCard(t));

          // Evitar duplicados: si un viaje aparece en created, no lo añadimos de joined
          const createdIds = new Set(createdCards.map((c) => c.tripId));
          const filteredJoined = joinedCards.filter((c) => !createdIds.has(c.tripId));

          const allCards = [...createdCards, ...filteredJoined];

          this.upcomingRatings = allCards;
          const today = new Date();

          // 1. Primero calculamos pendientes
          this.pendingRatings = allCards.filter((card) => {
            const end = new Date(card.endDate);
            if (end >= today) return false;

            const hasPendingOrganizer = !card.organizer.isRated;
            const hasPendingCompanions = card.companions.some((c) => !c.isRated);
            return hasPendingOrganizer || hasPendingCompanions;
          });

          // 2. Luego “próximos” = todos menos los que ya están en pendientes
          const pendingIds = new Set(this.pendingRatings.map((c) => c.tripId));
          this.upcomingRatings = allCards.filter((c) => !pendingIds.has(c.tripId));
          this.pendingRatings = allCards.filter((card) => {
            const end = new Date(card.endDate);
            if (end >= today) return false;

            const hasPendingOrganizer = !card.organizer.isRated;
            const hasPendingCompanions = card.companions.some((c) => !c.isRated);
            return hasPendingOrganizer || hasPendingCompanions;
          });
        })
      )
      .subscribe();
  }

  // Viajes que yo he creado (my-created)
  private mapCreatedTripToCard(trip: any, currentUser: any): TripRatingCard {
    // accepted_participants_json viene como string con objetos separados por comas sin array
    const companions: TripUser[] = this.parseParticipantsJson(
      trip.accepted_participants_json,
      currentUser.id
    );

    const organizer: TripUser = {
      userId: trip.creator_id,
      username: currentUser.username ?? 'Yo',
      avatarUrl: currentUser.image_url ?? trip.trip_image_url ?? '',
      isRated: false, // aquí luego puedes usar valoraciones reales
      rating: null,
    };

    return {
      tripId: trip.trip_id,
      tripName: trip.title,
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      cost: Number(trip.estimated_cost),
      imageUrl: trip.trip_image_url,
      organizer,
      companions,
    };
  }

  // Viajes a los que me he unido (my-participations)
  private mapJoinedTripToCard(trip: any): TripRatingCard {
    const organizer: TripUser = {
      userId: trip.creator_id,
      username: 'Organizador', // si no te viene el nombre, pon genérico
      avatarUrl: trip.creator_image_url ?? '',
      isRated: false,
      rating: null,
    };

    // Aquí no tienes la lista de compañeros en la respuesta,
    // así que de momento la dejamos vacía
    const companions: TripUser[] = [];

    return {
      tripId: trip.trip_id,
      tripName: trip.trip_name,
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      cost: 0, // no viene en la respuesta, pon 0 o añade campo si lo expones
      imageUrl: trip.trip_image_url,
      organizer,
      companions,
    };
  }

  // Parsear accepted_participants_json raro (no es un JSON válido de array)
  private parseParticipantsJson(raw: string | null, currentUserId: number): TripUser[] {
    if (!raw) return [];

    let fixed = raw.trim();
    if (!fixed.startsWith('[')) fixed = '[' + fixed;
    if (!fixed.endsWith(']')) fixed = fixed + ']';

    try {
      const arr = JSON.parse(fixed) as any[];
      return arr
        .filter((p) => p.id !== currentUserId)
        .map((p) => ({
          userId: p.id,
          username: p.username,
          avatarUrl: p.participant_image_url ?? '',
          isRated: false, // aquí luego podrás meter si ya está valorado
          rating: p.participant_avg_score ?? null,
        }));
    } catch (e) {
      console.error('Error parseando accepted_participants_json', e, raw);
      return [];
    }
  }

  // Modal helpers
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
      const win = window as any;
      if (modal && win.bootstrap) {
        win.bootstrap.Modal.getOrCreateInstance(modal).show();
      }
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
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;
    const authorId = currentUser.id;

    const { tripId, userId } = this.modalRating;

    this.ratingsService
      .createRating({
        trip_id: tripId,
        author_id: authorId,
        rated_user_id: userId,
        score: this.modalScore,
        comment: this.modalComment,
      })
      .subscribe(() => {
        const updateInList = (list: TripRatingCard[]) => {
          const trip = list.find((t) => t.tripId === tripId);
          if (!trip) return;

          if (this.modalRating?.isOrganizer && trip.organizer.userId === userId) {
            trip.organizer.isRated = true;
            trip.organizer.rating = this.modalScore;
          } else {
            const companion = trip.companions.find((c) => c.userId === userId);
            if (companion) {
              companion.isRated = true;
              companion.rating = this.modalScore;
            }
          }
        };

        updateInList(this.upcomingRatings);
        updateInList(this.pendingRatings);

        const modal = document.getElementById('valoracionModal');
        const win = window as any;
        if (modal && win.bootstrap) {
          win.bootstrap.Modal.getOrCreateInstance(modal).hide();
        }
        this.modalRating = null;

        this.recalculatePending();
      });
  }

  private recalculatePending() {
    const today = new Date();
    this.pendingRatings = this.upcomingRatings.filter((card) => {
      const end = new Date(card.endDate);
      if (end >= today) return false;

      const hasPendingOrganizer = !card.organizer.isRated;
      const hasPendingCompanions = card.companions.some((c) => !c.isRated);
      return hasPendingOrganizer || hasPendingCompanions;
    });
  }
}
