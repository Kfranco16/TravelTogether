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
    endDate: string | Date;
    imageUrl: string;
    totalRated: number;
    totalUsers: number;
    companionsCount: number;
  }[] = [];

  myTripRatings: {
    tripId: number;
    tripName: string;
    destination: string;
    startDate: string | Date;
    rated: { ratedUserId: number; username: string; score: number; comment: string }[];
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

  private buildMyTripRatings(myRatings: any[]) {
    // clave: tripId -> array de ratings míos en ese viaje
    const ratingsByTrip = new Map<number, any[]>();
    for (const r of myRatings) {
      const arr = ratingsByTrip.get(r.trip_id) ?? [];
      arr.push(r);
      ratingsByTrip.set(r.trip_id, arr);
    }

    this.myTripRatings = this.ratedTrips.map((trip) => {
      const tripRatings = ratingsByTrip.get(trip.tripId) ?? [];

      // necesitamos el username del valorado: lo buscamos en allCards
      const card = this.allCards.find((c) => c.tripId === trip.tripId);
      const usersIndex = new Map<number, string>();
      if (card) {
        usersIndex.set(card.organizer.userId, card.organizer.username);
        for (const c of card.companions) {
          usersIndex.set(c.userId, c.username);
        }
      }

      const rated = tripRatings.map((r) => ({
        ratedUserId: r.rated_user_id,
        username: usersIndex.get(r.rated_user_id) ?? `Usuario ${r.rated_user_id}`,
        score: r.score,
        comment: r.comment,
      }));

      return {
        tripId: trip.tripId,
        tripName: trip.tripName,
        destination: trip.destination,
        startDate: trip.startDate,
        rated,
      };
    });
  }

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
      myRatingsResp: this.ratingsService
        .getRatingsByAuthor(currentUser.id)
        .pipe(catchError(() => of([]))),
    })
      .pipe(
        map(({ createdResp, joinedResp, myRatingsResp }: any) => {
          const created = createdResp.data ?? [];
          const joined = joinedResp.data ?? [];
          const myRatings = myRatingsResp as any[];

          // CAMBIO: pasar myRatings a mapCreatedTripToCard
          const createdCards: TripRatingCard[] = created.map((t: any) =>
            this.mapCreatedTripToCard(t, currentUser, myRatings)
          );
          const joinedCards: TripRatingCard[] = joined.map((t: any) => this.mapJoinedTripToCard(t));

          const createdIds = new Set(createdCards.map((c) => c.tripId));
          const filteredJoined = joinedCards.filter((c) => !createdIds.has(c.tripId));

          this.allCards = [...createdCards, ...filteredJoined];

          this.recalculateSections(myRatings);
          this.buildMyTripRatings(myRatings);
        })
      )
      .subscribe();
  }

  private recalculateSections(myRatings: any[]) {
    const today = new Date();

    // Construir mapa: tripId -> Set de usuarios que YO he valorado
    const myRatedUsersPerTrip = new Map<number, Set<number>>();
    for (const r of myRatings) {
      if (!myRatedUsersPerTrip.has(r.trip_id)) {
        myRatedUsersPerTrip.set(r.trip_id, new Set());
      }
      myRatedUsersPerTrip.get(r.trip_id)!.add(r.rated_user_id);
    }

    // Filtrar solo viajes donde hay al menos un compañero
    const cardsWithCompanions = this.allCards.filter((card) => card.companions.length > 0);

    // 1) PENDIENTES: viajes pasados donde me falte alguien por valorar (según myRatings, no isRated)
    this.pendingRatings = cardsWithCompanions.filter((card) => {
      const end = new Date(card.endDate);
      if (end >= today) return false; // solo pasados

      const myRatedUsers = myRatedUsersPerTrip.get(card.tripId) ?? new Set();
      const usersToRate = card.companions.length; // solo compañeros, no yo (organizador)
      const myRatedCount = myRatedUsers.size;

      // pendiente = me falta alguien por valorar
      return myRatedCount < usersToRate;
    });

    // 2) YA VALORADOS: pasados donde he valorado a TODOS los compañeros
    this.ratedTrips = cardsWithCompanions
      .map((card) => {
        const myRatedUsers = myRatedUsersPerTrip.get(card.tripId) ?? new Set();
        const users = [card.organizer, ...card.companions];
        const totalUsers = users.length;
        const usersToRate = card.companions.length;
        const totalRated = usersToRate; // si está aquí es que he valorado a todos

        return {
          tripId: card.tripId,
          tripName: card.tripName,
          destination: card.destination,
          startDate: card.startDate,
          endDate: card.endDate,
          imageUrl: card.imageUrl,
          totalRated,
          totalUsers,
          companionsCount: card.companions.length,
        };
      })
      .filter((t) => {
        const end = new Date(t.endDate as string);
        const isPast = end < today;
        const hasCompanions = t.companionsCount > 0;

        // Recalcular aquí también para ser seguro
        const myRatedUsers = myRatedUsersPerTrip.get(t.tripId) ?? new Set();
        const usersToRate = t.companionsCount;
        const allRatedByMe = myRatedUsers.size === usersToRate;

        return isPast && hasCompanions && allRatedByMe;
      });

    const pendingIds = new Set(this.pendingRatings.map((c) => c.tripId));
    const ratedIds = new Set(this.ratedTrips.map((t) => t.tripId));

    // 3) PRÓXIMOS: todo lo que no es ni pendiente ni ya valorado (y tiene compañeros)
    this.upcomingRatings = cardsWithCompanions.filter((card) => {
      if (pendingIds.has(card.tripId)) return false;
      if (ratedIds.has(card.tripId)) return false;
      return true;
    });
  }

  openRatingsDetail(tripId: number) {
    // Más adelante: abrir modal o navegar al detalle
    console.log('Ver valoraciones dadas en viaje', tripId);
  }

  // Viajes que yo he creado (my-created)
  private mapCreatedTripToCard(trip: any, currentUser: any, myRatings: any[]): TripRatingCard {
    const companions: TripUser[] = this.parseParticipantsJson(
      trip.accepted_participants_json,
      currentUser.id,
      trip.trip_id, // pasar tripId
      myRatings // pasar myRatings
    );

    const organizer: TripUser = {
      userId: trip.creator_id,
      username: currentUser.username ?? 'Yo',
      avatarUrl: currentUser.image_url ?? trip.trip_image_url ?? '',
      isRated: true,
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
      // idem: si tuvieras creator_avg_score aquí, podrías marcarlo
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

  // Parsear accepted_participants_json y marcar isRated según participant_avg_score
  private parseParticipantsJson(
    raw: string | null,
    currentUserId: number,
    tripId: number,
    myRatings: any[]
  ): TripUser[] {
    if (!raw) return [];

    // Construir Set de usuarios que YO he valorado en este viaje
    const myRatedUsers = new Set<number>();
    for (const r of myRatings) {
      if (r.trip_id === tripId) {
        myRatedUsers.add(r.rated_user_id);
      }
    }

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
          // CAMBIO: isRated = true solo si YO he valorado a este usuario en este viaje
          isRated: myRatedUsers.has(p.id),
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

        // Reload ratings to recalculate sections with updated data
        this.ratingsService
          .getRatingsByAuthor(authorId)
          .pipe(catchError(() => of([])))
          .subscribe((myRatings: any[]) => {
            this.recalculateSections(myRatings);
            this.buildMyTripRatings(myRatings);
          });
      });
  }
}
