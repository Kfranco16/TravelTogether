import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardUsuario } from '../../components/card-usuario/card-usuario';

export interface TripUser {
  userId: number;
  username: string;
  avatarUrl: string;
  isRated: boolean;
  rating: number | null;
}

export interface TripRatingCard {
  tripId: number;
  tripName: string;
  destination: string;
  startDate: string | Date;
  endDate: string | Date;
  cost: number;
  imageUrl: string;
  organizer: TripUser;
  companions: TripUser[];
}

@Component({
  selector: 'app-trip-rating-card',
  standalone: true,
  imports: [CommonModule, CardUsuario],
  templateUrl: './trip-rating-card.html',
  styleUrls: ['./trip-rating-card.css'],
})
export class TripRatingCardComponent {
  @Input() trip!: TripRatingCard;
  @Input() currentUserId!: number;
  @Input() isPendingSection: boolean = false;

  @Output() rate = new EventEmitter<{
    tripId: number;
    userId: number;
    username: string;
    avatarUrl: string;
    isOrganizer: boolean;
  }>();

  constructor(private router: Router) {}

<<<<<<< HEAD
=======
  // Organizer directo desde el padre
>>>>>>> origin/develop
  get organizer(): TripUser {
    return this.trip.organizer;
  }

<<<<<<< HEAD
=======
  // Compañeros directos desde el padre, sin añadir al logueado a mano
>>>>>>> origin/develop
  get companions(): TripUser[] {
    return this.trip.companions;
  }

  onRateOrganizer() {
    this.rate.emit({
      tripId: this.trip.tripId,
      userId: this.trip.organizer.userId,
      username: this.trip.organizer.username,
      avatarUrl: this.trip.organizer.avatarUrl,
      isOrganizer: true,
    });
  }

  onRateCompanion(companion: TripUser) {
    this.rate.emit({
      tripId: this.trip.tripId,
      userId: companion.userId,
      username: companion.username,
      avatarUrl: companion.avatarUrl,
      isOrganizer: false,
    });
  }

  irADetalleUsuario(companion: TripUser) {
    if (companion && companion.userId) {
      this.router.navigate([`perfil/${companion.userId}`]);
    }
  }

  irDetalleViaje() {
    this.router.navigate([`viaje/${this.trip.tripId}`]);
  }
}
