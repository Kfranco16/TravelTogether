import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardUsuario } from '../../components/card-usuario/card-usuario';
import { Iuser } from '../../interfaces/iuser';

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
  @Input() usuario!: Iuser;
  @Input() currentUserId!: number;
  @Input() isPendingSection: boolean = false;

  // Emite datos para abrir el modal en el padre
  @Output() rate = new EventEmitter<{
    tripId: number;
    userId: number;
    username: string;
    avatarUrl: string;
    isOrganizer: boolean;
  }>();

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
}
