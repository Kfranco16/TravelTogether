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
  ratedTrips: {
    tripId: number;
    tripName: string;
    destination: string;
    startDate: string | Date;
    imageUrl: string;
    totalRated: number;
    totalUsers: number;
  }[] = [];

  currentUserId!: number;
  private allCards: TripRatingCard[] = [];

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

    forkJoin({
      createdResp: this.participationService
        .getMyCreatedTrips()
        .pipe(catchError(() => of({ data: [] }))),
      joinedResp: this.participationService
        .getMyParticipations()
        .pipe(catchError(() => of({ data: [] }))),
      myRatings: this.ratingsService
        .getRatingsByAuthor(currentUser.id)
        .pipe(catchError(() => of([]))),
    })
      .pipe(
        map(({ createdResp, joinedResp, myRatings }: any) => {
          const created = createdResp.data ?? [];
          const joined = joinedResp.data ?? [];

          const createdCards: TripRatingCard[] = created.map((t: any) =>
            this.mapCreatedTripToCard(t, currentUser)
          );
          const joinedCards: TripRatingCard[] = joined.map((t: any) => this.mapJoinedTripToCard(t));

          // evitar duplicados (prioridad a creados)
          const createdIds = new Set(createdCards.map((c) => c.tripId));
          const filteredJoined = joinedCards.filter((c) => !createdIds.has(c.tripId));

          this.allCards = [...createdCards, ...filteredJoined];

          // marcar ya valorados
          this.applyExistingRatings(this.allCards, myRatings, currentUser.id);

          // calcular secciones
          this.recalculateSections();
        })
      )
      .subscribe();
  }

  private applyExistingRatings(cards: TripRatingCard[], myRatings: any[], currentUserId: number) {
    const ratingsByTripAndUser = new Map<string, any>();

    for (const r of myRatings) {
      if (r.author_id !== currentUserId) continue;
      const key = `${r.trip_id}-${r.rated_user_id}`;
      ratingsByTripAndUser.set(key, r);
    }

    for (const card of cards) {
      const orgKey = `${card.tripId}-${card.organizer.userId}`;
      if (ratingsByTripAndUser.has(orgKey)) {
        const r = ratingsByTripAndUser.get(orgKey);
        card.organizer.isRated = true;
        card.organizer.rating = r.score ?? null;
      }

      for (const c of card.companions) {
        const key = `${card.tripId}-${c.userId}`;
        if (ratingsByTripAndUser.has(key)) {
          const r = ratingsByTripAndUser.get(key);
          c.isRated = true;
          c.rating = r.score ?? null;
        }
      }
    }
  }

  private recalculateSections() {
    const today = new Date();

    // PENDIENTES
    this.pendingRatings = this.allCards.filter((card) => {
      const end = new Date(card.endDate);
      if (end >= today) return false;

      const hasPendingOrganizer = !card.organizer.isRated;
      const hasPendingCompanions = card.companions.some((c) => !c.isRated);
      return hasPendingOrganizer || hasPendingCompanions;
    });

    // PRÓXIMOS = allCards - pendientes
    const pendingIds = new Set(this.pendingRatings.map((c) => c.tripId));
    this.upcomingRatings = this.allCards.filter((c) => !pendingIds.has(c.tripId));

    // YA VALORADOS (mini)
    this.ratedTrips = this.allCards
      .map((card) => {
        const users = [card.organizer, ...card.companions];
        const totalUsers = users.length;
        const totalRated = users.filter((u) => u.isRated).length;

        return {
          tripId: card.tripId,
          tripName: card.tripName,
          destination: card.destination,
          startDate: card.startDate,
          imageUrl: card.imageUrl,
          totalRated,
          totalUsers,
        };
      })
      .filter((t) => t.totalRated > 0);
  }

  // Viajes que yo he creado (my-created)
  private mapCreatedTripToCard(trip: any, currentUser: any): TripRatingCard {
    const companions: TripUser[] = this.parseParticipantsJson(
      trip.accepted_participants_json,
      currentUser.id
    );

    const organizer: TripUser = {
      userId: trip.creator_id,
      username: currentUser.username ?? 'Yo',
      avatarUrl: currentUser.image_url ?? trip.trip_image_url ?? '',
      isRated: false,
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
      username: 'Organizador',
      avatarUrl: trip.creator_image_url ?? '',
      isRated: false,
      rating: null,
    };

    const companions: TripUser[] = [];

    return {
      tripId: trip.trip_id,
      tripName: trip.trip_name,
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      cost: 0,
      imageUrl: trip.trip_image_url,
      organizer,
      companions,
    };
  }

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
          isRated: false,
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

        updateInList(this.allCards);
        updateInList(this.pendingRatings);
        updateInList(this.upcomingRatings);

        const modal = document.getElementById('valoracionModal');
        const win = window as any;
        if (modal && win.bootstrap) {
          win.bootstrap.Modal.getOrCreateInstance(modal).hide();
        }
        this.modalRating = null;

        this.recalculateSections();
      });
  }
}
