import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
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
    const ratingsByTrip = new Map<number, any[]>();
    for (const r of myRatings) {
      const arr = ratingsByTrip.get(r.trip_id) ?? [];
      arr.push(r);
      ratingsByTrip.set(r.trip_id, arr);
    }

    this.myTripRatings = this.ratedTrips.map((trip) => {
      const tripRatings = ratingsByTrip.get(trip.tripId) ?? [];

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
        switchMap(({ createdResp, joinedResp, myRatingsResp }: any) => {
          const created = createdResp.data ?? [];
          const joined = joinedResp.data ?? [];
          const myRatings = myRatingsResp as any[];

          // ✨ Mapear createdCards CON imágenes correctas
          const createdCardRequests = created.map((t: any) =>
            this.mapCreatedTripToCardWithImages(t, currentUser, myRatings)
          );

          // ✨ Mapear joinedCards CON imágenes correctas
          const joinedCardRequests = joined.map((t: any) => this.mapJoinedTripToCardWithImages(t));

          // Ejecutar todas las peticiones en paralelo
          return forkJoin({
            createdCards: forkJoin(createdCardRequests).pipe(catchError(() => of([]))),
            joinedCards: forkJoin(joinedCardRequests).pipe(catchError(() => of([]))),
            myRatings: of(myRatings),
          });
        }),
        map(({ createdCards, joinedCards, myRatings }: any) => {
          const createdIds = new Set(createdCards.map((c: any) => c.tripId));
          const filteredJoined = joinedCards.filter((c: any) => !createdIds.has(c.tripId));

          this.allCards = [...createdCards, ...filteredJoined];

          this.recalculateSections(myRatings);
          this.buildMyTripRatings(myRatings);
        })
      )
      .subscribe();
  }

  // ✨ NUEVO: Mapear viajes creados CON imágenes correctas
  private mapCreatedTripToCardWithImages(
    trip: any,
    currentUser: any,
    myRatings: any[]
  ): Observable<TripRatingCard> {
    const tripId = trip.trip_id;

    // Obtener participantes con imágenes correctas
    return this.participationService.getParticipantsByTripIdWithImages(tripId).pipe(
      map((participants: any[]) => {
        // Filtrar solo los aceptados y excluir al creador
        const acceptedParticipants = participants.filter(
          (p: any) => p.status === 'accepted' && p.user_id !== trip.creator_id
        );

        // Convertir a TripUser
        const companions: TripUser[] = acceptedParticipants.map((p: any) => {
          // Verificar si este usuario ha sido valorado por mí
          const isRated = myRatings.some(
            (r: any) => r.trip_id === tripId && r.rated_user_id === p.user_id
          );

          return {
            userId: p.user_id,
            username: p.username,
            avatarUrl: p.user_image_url ?? '',
            isRated,
            rating: parseFloat(p.user_avg_score) || null,
          };
        });

        const organizer: TripUser = {
          userId: trip.creator_id,
          username: currentUser.username ?? 'Yo',
          avatarUrl: currentUser.image_url ?? trip.trip_image_url ?? '',
          isRated: true,
          rating: null,
        };

        return {
          tripId: tripId,
          tripName: trip.title,
          destination: trip.destination,
          startDate: trip.start_date,
          endDate: trip.end_date,
          cost: Number(trip.estimated_cost),
          imageUrl: trip.trip_image_url,
          organizer,
          companions,
        };
      }),
      catchError((err) => {
        console.error('Error obteniendo participantes con imágenes:', err);
        // Fallback: devolver card sin compañeros
        return of({
          tripId: trip.trip_id,
          tripName: trip.title,
          destination: trip.destination,
          startDate: trip.start_date,
          endDate: trip.end_date,
          cost: Number(trip.estimated_cost),
          imageUrl: trip.trip_image_url,
          organizer: {
            userId: trip.creator_id,
            username: currentUser.username ?? 'Yo',
            avatarUrl: currentUser.image_url ?? '',
            isRated: true,
            rating: null,
          },
          companions: [],
        } as TripRatingCard);
      })
    );
  }

  // ✨ NUEVO: Mapear viajes unidos CON imágenes correctas
  private mapJoinedTripToCardWithImages(trip: any): Observable<TripRatingCard> {
    const tripId = trip.trip_id;

    // Obtener organizador con imagen correcta
    return this.participationService.getParticipantsByTripIdWithImages(tripId).pipe(
      map((participants: any[]) => {
        // Buscar al organizador
        const organizerParticipant = participants.find(
          (p: any) => p.user_id === trip.creator_id && p.status === 'accepted'
        );

        const organizer: TripUser = {
          userId: trip.creator_id,
          username: organizerParticipant?.username ?? 'Organizador',
          avatarUrl: organizerParticipant?.user_image_url ?? trip.creator_image_url ?? '',
          isRated: false,
          rating: organizerParticipant
            ? parseFloat(organizerParticipant.user_avg_score) || null
            : null,
        };

        return {
          tripId: tripId,
          tripName: trip.trip_name,
          destination: trip.destination,
          startDate: trip.start_date,
          endDate: trip.end_date,
          cost: 0,
          imageUrl: trip.trip_image_url,
          organizer,
          companions: [],
        } as TripRatingCard;
      }),
      catchError((err) => {
        console.error('Error obteniendo organizador con imagen:', err);
        // Fallback
        return of({
          tripId: trip.trip_id,
          tripName: trip.trip_name,
          destination: trip.destination,
          startDate: trip.start_date,
          endDate: trip.end_date,
          cost: 0,
          imageUrl: trip.trip_image_url,
          organizer: {
            userId: trip.creator_id,
            username: 'Organizador',
            avatarUrl: trip.creator_image_url ?? '',
            isRated: false,
            rating: null,
          },
          companions: [],
        } as TripRatingCard);
      })
    );
  }

  // ... resto del código igual ...

  private recalculateSections(myRatings: any[]) {
    const today = new Date();

    const myRatedUsersPerTrip = new Map<number, Set<number>>();
    for (const r of myRatings) {
      if (!myRatedUsersPerTrip.has(r.trip_id)) {
        myRatedUsersPerTrip.set(r.trip_id, new Set());
      }
      myRatedUsersPerTrip.get(r.trip_id)!.add(r.rated_user_id);
    }

    const cardsWithCompanions = this.allCards.filter((card) => card.companions.length > 0);

    this.pendingRatings = cardsWithCompanions.filter((card) => {
      const end = new Date(card.endDate);
      if (end >= today) return false;

      const myRatedUsers = myRatedUsersPerTrip.get(card.tripId) ?? new Set();
      const usersToRate = card.companions.length;
      const myRatedCount = myRatedUsers.size;

      return myRatedCount < usersToRate;
    });

    this.ratedTrips = cardsWithCompanions
      .map((card) => {
        const myRatedUsers = myRatedUsersPerTrip.get(card.tripId) ?? new Set();
        const users = [card.organizer, ...card.companions];
        const totalUsers = users.length;
        const usersToRate = card.companions.length;
        const totalRated = usersToRate;

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

        const myRatedUsers = myRatedUsersPerTrip.get(t.tripId) ?? new Set();
        const usersToRate = t.companionsCount;
        const allRatedByMe = myRatedUsers.size === usersToRate;

        return isPast && hasCompanions && allRatedByMe;
      });

    const pendingIds = new Set(this.pendingRatings.map((c) => c.tripId));
    const ratedIds = new Set(this.ratedTrips.map((t) => t.tripId));

    this.upcomingRatings = cardsWithCompanions.filter((card) => {
      if (pendingIds.has(card.tripId)) return false;
      if (ratedIds.has(card.tripId)) return false;
      return true;
    });
  }

  openRatingsDetail(tripId: number) {
    console.log('Ver valoraciones dadas en viaje', tripId);
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
