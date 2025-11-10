import { Component, signal, OnInit, OnDestroy, Inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardViaje } from '../../components/card-viaje/card-viaje';
import { TripService } from '../../core/services/viajes';

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
  estimated_cost?: string; // Change to string to match the API response
  min_participants?: number;
  transport?: string;
  accommodation?: string;
  itinerary?: string;
  status?: string;
  latitude?: string; // Change to string to match the API response
  longitude?: string; // Change to string to match the API response
  created_at?: string;
  updated_at?: string;
  isFavorite?: boolean;
  solicitado?: boolean;
}

@Component({
  selector: 'app-landing',
  imports: [CardViaje],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  private intervalId: any;
  currentImageIndex = signal(0);

  trips: Trip[] = [];
  // Sustituye esto por el sistema real de manejo de tokens en producción
  private token =
    'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsInVzZXJuYW1lIjoiZWxlbmFnYXJjaWEiLCJlbWFpbCI6ImVsZW5hZ2FyY2lhQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzYyNzAzNTc5LCJleHAiOjE3NjI3MTA3Nzl9.DGinLb3bWqRh2dRY8RvJ-GZqgMzUuHcvS9kb4S6OAMo'; // tu token completo
  constructor(@Inject(TripService) private tripService: TripService) {}

  // Array de imágenes panorámicas para el hero
  heroImages = signal([
    {
      id: 1,
      url: 'https://images.squarespace-cdn.com/content/v1/591d98d33a0411cffe941a45/9d277969-91dc-4230-9447-6ab9d7446f71/viajes+grupales+viajar+inspira.jpg',
      alt: 'Viajeros caminando por un sendero en medio de la naturaleza',
      caption: 'Comparte aventuras únicas',
    },
    {
      id: 2,
      url: 'https://cloudfront-us-east-1.images.arcpublishing.com/infobae/B6VK45VAQNDQVF3QRY5PP7IX2I.png',
      alt: 'Viajeros caminando por un sendero en medio de la naturaleza',
      caption: 'Descubre destinos increíbles',
    },

    {
      id: 3,
      url: 'https://mochilerosentailandia.com/wp-content/uploads/2016/11/1-6.jpg',
      alt: 'Viajeros caminando por un sendero en medio de la naturaleza',
      caption: 'Comparte aventuras únicas',
    },
  ]);

  // Usamos signals para manejar nuestros arrays de placeholders.
  // Esto nos prepara para cuando los datos vengan de una API.
  viajesPlaceholder = signal([
    { id: 1 },
    { id: 2 },
    { id: 3 },
    { id: 4 },
    { id: 5 },
    { id: 6 },
    { id: 7 },
    { id: 8 },
    { id: 9 },
  ]);

  viajesVisibles = signal(6); // Mostrar 6 viajes inicialmente

  mostrarMasViajes() {
    const actual = this.viajesVisibles();
    const nuevo = Math.min(actual + 6, this.viajesPlaceholder().length);
    this.viajesVisibles.set(nuevo);
  }

  // Hacemos lo mismo para los testimonios.
  testimonioActual = signal(0); // Controla el grupo de testimonios visible

  testimonios = signal([
    {
      texto:
        '¡Una experiencia increíble! Encontré un grupo para ir a Costa Rica y fue el mejor viaje de mi vida. La organización a través de la app fue impecable.',
      nombre: 'Elena Vargas',
      viaje: 'Viaje a Costa Rica',
      avatarId: 1,
    },
    {
      texto:
        'La mejor forma de conocer gente nueva que comparte tu pasión por viajar. Pude unirme a una ruta gastronómica por Japón que fue espectacular.',
      nombre: 'Marco Diaz',
      viaje: 'Ruta por Kioto',
      avatarId: 2,
    },
    {
      texto:
        'Siempre había querido ir a Perú, pero no me animaba a ir solo. Gracias a esta plataforma, encontré un grupo genial y me sentí seguro en todo momento.',
      nombre: 'Sofía Moreno',
      viaje: 'Trekking en los Andes',
      avatarId: 3,
    },
    {
      texto:
        'Viajé por Europa con un grupo increíble. Compartimos gastos y experiencias que nunca olvidaré. La plataforma hizo todo el proceso muy fácil.',
      nombre: 'Carlos Ruiz',
      viaje: 'Tour por Europa',
      avatarId: 4,
    },
    {
      texto:
        'Encontré compañeros de viaje perfectos para mi aventura en Tailandia. La comunicación fue excelente y todo salió mejor de lo esperado.',
      nombre: 'Ana Torres',
      viaje: 'Aventura en Tailandia',
      avatarId: 5,
    },
    {
      texto:
        'Mi primera experiencia mochilera fue gracias a esta app. Conocí gente maravillosa y juntos exploramos lugares increíbles en Nueva Zelanda.',
      nombre: 'Diego Mendoza',
      viaje: 'Mochilero por Nueva Zelanda',
      avatarId: 6,
    },
  ]);

  mostrarSiguientesTestimonios() {
    const actual = this.testimonioActual();
    const siguiente = actual + 3 >= this.testimonios().length ? 0 : actual + 3;
    this.testimonioActual.set(siguiente);
  }

  mostrarTestimoniosAnteriores() {
    const actual = this.testimonioActual();
    const anterior = actual - 3 < 0 ? this.testimonios().length - 3 : actual - 3;
    this.testimonioActual.set(anterior);
  }

  ngOnInit() {
    // Iniciar la rotación automática de imágenes cada 5 segundos
    this.intervalId = setInterval(() => {
      const nextIndex = (this.currentImageIndex() + 1) % this.heroImages().length;
      this.currentImageIndex.set(nextIndex);
    }, 5000);

    this.tripService.getTrips(this.token).subscribe({
      next: (data: { results: Trip[] }) => {
        // Los viajes están dentro de data.results
        this.trips = data.results;
      },
      error: (err: any) => {
        console.error('Error al cargar viajes', err);
      },
    });
  }

  ngOnDestroy() {
    // Limpiar el intervalo cuando el componente se destruye
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
