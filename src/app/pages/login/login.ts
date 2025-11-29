import { Component, inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { toast } from 'ngx-sonner';

import { AuthService } from '../../core/services/auth';
import { TripService } from '../../core/services/viajes';

interface LoginResponse {
  user: any;
  token: string;
}

export interface Trip {
  id: number;
  origin?: string;
  destination?: string;
  title?: string;
  image?: string;
  description?: string;
  creator_id?: number;
  start_date?: string;
  end_date?: string;
  estimated_cost?: string;
  min_participants?: number;
  transport?: string;
  accommodation?: string;
  itinerary?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  updated_at?: string;
  isFavorite?: boolean;
  solicitado?: boolean;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, DatePipe],
  templateUrl: './login.html',
  styles: ``,
})
export class Login implements OnInit {
  authService = inject(AuthService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private tripService = inject(TripService);

  formSubmitAttempt = false;

  onTripClick(trip: Trip): void {
    alert('Necesitas iniciar sesión para ver más detalles de este viaje.');
  }

  trips: Trip[] = [];
  viajesVisibles: Trip[] = [];
  itemsPorPagina = 12;
  indiceActuakl = 0;
  viajesFiltrados: Trip[] = [];

  portadas: Record<number, { url: string; alt: string }> = {};

  loginForm: FormGroup = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  ngOnInit(): void {
    const token = localStorage.getItem('token') || '';

    this.tripService.getTrips(token).subscribe({
      next: (data: { results: Trip[] }) => {
        this.trips = data.results || [];
        this.viajesFiltrados = this.trips;
        this.actualizarPaginacionFiltrada();

        this.viajesVisibles.slice(0, 10).forEach((trip) => {
          this.cargarPortadaTrip(trip.id);
        });
      },
      error: (err) => {
        console.error('Error al cargar viajes en login', err);
      },
    });
  }

  private actualizarPaginacionFiltrada(): void {
    const viajesFiltrados = this.viajesFiltrados;
    const indiceFinal = this.indiceActuakl + this.itemsPorPagina;
    this.viajesVisibles = viajesFiltrados.slice(0, indiceFinal);
  }

  private cargarPortadaTrip(tripId: number): void {
    this.tripService.getImagesByTripId(tripId).subscribe({
      next: (data: any) => {
        const fotos: any[] = data?.results?.results || [];
        const fotoPortada = fotos.find((f) => f.main_img == '0' || f.main_img == 0);

        this.portadas[tripId] = {
          url: fotoPortada?.url || 'images/coverDefault.jpg',
          alt: fotoPortada?.description || 'Imagen de portada',
        };
      },
      error: () => {
        this.portadas[tripId] = {
          url: 'images/coverDefault.jpg',
          alt: 'Imagen de portada por defecto',
        };
      },
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.formSubmitAttempt));
  }

  onSubmit(): void {
    this.formSubmitAttempt = true;
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.login(email, password);
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  private async login(email: string, password: string) {
    try {
      const response: LoginResponse = await this.authService.login({ email, password });

      if (response && response.user) {
        this.authService.setCurrentUser(response.user);
        localStorage.setItem('token', response.token);

        toast.success('¡Usuario logueado correctamente!');
        this.router.navigate(['/home']);
      }
    } catch (err: any) {
      toast.error(err?.error?.message || 'Error en el inicio de sesión');
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  resetForm(): void {
    this.loginForm.reset();
    this.formSubmitAttempt = false;
  }
}
