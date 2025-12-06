import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardUsuario } from '../../components/card-usuario/card-usuario';
import { Iuser } from '../../interfaces/iuser';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';

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

  constructor(private authService: AuthService, private router: Router) {}

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

  irADetalleUsuario(companion: any) {
    console.log('Click ejecutado, companion:', companion);
    console.log('companion.userId:', companion?.userId);

    if (companion && companion.userId) {
      console.log('Navegando a:', companion.userId);
      this.router.navigate([`perfil/${companion.userId}`]);
    }
  }

  irDetalleViaje() {
    this.router.navigate([`viaje/${this.trip.tripId}`]);
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
