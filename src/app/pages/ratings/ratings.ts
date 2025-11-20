import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TripService } from '../../core/services/viajes';
import { RatingsService } from '../../core/services/ratings'; // Debes crear/adaptar este servicio
import { AuthService } from '../../core/services/auth';
import { Trip } from '../../interfaces/trip';
import { Iuser } from '../../interfaces/iuser';

import { DatePipe } from '@angular/common';

// Interfaces auxiliares
interface Companion {
  userId: number;
  username: string;
  avatarUrl?: string;
  isRated: boolean;
}

interface TripRating {
  tripId: number;
  tripName: string;
  destination: string;
  startDate: string;
  endDate: string;
  cost: number;
  imageUrl?: string;
  companions: Companion[];
}

@Component({
  selector: 'app-valoraciones-pendientes',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  providers: [TripService, RatingsService, AuthService],
  templateUrl: './ratings.html',
  styleUrls: ['./ratings.css'],
})
export class ValoracionesPendientesComponent {
  pendingRatings = [
    {
      tripId: 1,
      tripName: 'Escapada cultural a Roma',
      destination: 'Roma',
      startDate: '2025-03-20',
      endDate: '2025-03-25',
      cost: 850,
      imageUrl:
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
      organizer: {
        userId: 88,
        username: 'Laura (Organizadora)',
        avatarUrl: 'https://randomuser.me/api/portraits/women/47.jpg',
        isRated: false,
        rating: 5,
      },
      companions: [
        {
          userId: 42,
          username: 'Ana',
          avatarUrl: 'https://randomuser.me/api/portraits/women/42.jpg',
          isRated: false,
          rating: 4,
        },
        {
          userId: 65,
          username: 'Carlos',
          avatarUrl: 'https://randomuser.me/api/portraits/men/65.jpg',
          isRated: true,
          rating: 5,
        },
      ],
    },
    {
      tripId: 2,
      tripName: 'Senderismo en Pirineos',
      destination: 'Huesca',
      startDate: '2025-04-08',
      endDate: '2025-04-13',
      cost: 650,
      imageUrl:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
      organizer: {
        userId: 51,
        username: 'Marcos (Organizador)',
        avatarUrl: 'https://randomuser.me/api/portraits/men/51.jpg',
        isRated: false,
        rating: 4,
      },
      companions: [
        {
          userId: 39,
          username: 'Jorge',
          avatarUrl: 'https://randomuser.me/api/portraits/men/39.jpg',
          isRated: false,
          rating: 3,
        },
        {
          userId: 18,
          username: 'Lucía',
          avatarUrl: 'https://randomuser.me/api/portraits/women/15.jpg',
          isRated: true,
          rating: 5,
        },
      ],
    },
  ];

  modalRating: {
    tripId: number;
    userId: number;
    username: string;
    avatarUrl: string;
    isOrganizer?: boolean;
  } | null = null;
  modalScore = 0;
  modalComment = '';

  getEstrellas(rating: number) {
    const estrellas = [];
    for (let i = 1; i <= 5; i++) {
      estrellas.push({
        icon: 'bi-star-fill',
        color: i <= rating ? 'text-warning' : 'text-secondary',
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
    const { tripId, userId, isOrganizer } = this.modalRating;
    for (const trip of this.pendingRatings) {
      if (trip.tripId === tripId) {
        // Organizador
        if (isOrganizer && trip.organizer.userId === userId) {
          trip.organizer.isRated = true;
          trip.organizer.rating = this.modalScore;
        }
        // Compañeros
        for (const companion of trip.companions) {
          if (!isOrganizer && companion.userId === userId) {
            companion.isRated = true;
            companion.rating = this.modalScore;
          }
        }
      }
    }
    // Cierra modal
    const modal = document.getElementById('valoracionModal');
    // @ts-ignore
    if (modal && window.bootstrap) window.bootstrap.Modal.getOrCreateInstance(modal).hide();
    this.modalRating = null;
  }
}
