import { Component } from '@angular/core';
import { CardUsuario } from '../card-usuario/card-usuario';

@Component({
  selector: 'app-card-viaje',
  imports: [CardUsuario],
  templateUrl: './card-viaje.html',
  styleUrl: './card-viaje.css',
})
export class CardViaje {
  getShowDaysBadge(startDate: string): boolean {
    const today = new Date();
    const start = new Date(startDate);
    const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff < 15 && diff > 0;
  }

  getDaysLeft(startDate: string): number {
    const today = new Date();
    const start = new Date(startDate);
    return Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  getBadgeClass(status: string): string {
    switch (status) {
      case 'open':
        return 'bg-success';
      case 'draft':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getBadgeText(status: string): string {
    switch (status) {
      case 'open':
        return 'Abierto';
      case 'draft':
        return 'Últimos días';
      default:
        return status;
    }
  }

  // isFavorite: boolean = false;

  toggleFavorito(trip: any) {
    trip.isFavorite = !trip.isFavorite;
  }
  getFavoriteIconClass(isFavorite: any): string {
    return isFavorite ? 'bi-heart-fill text-danger' : 'bi-heart text-white';
  }

  getUsuarioById(id: number): any | undefined {
    return this.usuarios.find((user) => user.id === id.toString());
  }

  trips = [
    {
      id: 1,
      origin: 'Barcelona',
      destination: 'Lisboa',
      title: 'Aventura Costera',
      image:
        'https://content-viajes.nationalgeographic.com.es/medio/2024/11/07/alfama_151256d3_241107153719_1200x800.webp',
      description: 'Un viaje de 5 días recorriendo la costa ibérica.',
      creator_id: 1,
      start_date: '2025-11-11',
      end_date: '2025-11-25',
      estimated_cost: 450.0,
      min_participants: 3,
      transport: 'Coche',
      accommodation: 'Hostal',
      itinerary: 'Día 1: Salida hacia Valencia, Día 2: Alicante...',
      status: 'open',
      latitude: 38.7169,
      longitude: -9.1399,
      created_at: '2025-10-27 08:39:38',
      updated_at: '2025-10-27 08:39:38',
      isFavorite: false,
    },
    {
      id: 2,
      origin: 'Madrid',
      destination: 'Granada',
      title: 'Escapada Cultural',
      image: 'https://content.r9cdn.net/rimg/dimg/3b/c2/b4c4bfb9-city-27138-55689ae0.jpg',
      description: 'Visita a la Alhambra y degustación de comida andaluza.',
      creator_id: 2,
      start_date: '2025-08-01',
      end_date: '2025-08-05',
      estimated_cost: 300.0,
      min_participants: 2,
      transport: 'Tren',
      accommodation: 'Hotel',
      itinerary: 'Día 1: Llegada, Día 2: Recorrido por la ciudad...',
      status: 'open',
      latitude: 37.1773,
      longitude: -3.5986,
      created_at: '2025-10-27 08:39:38',
      updated_at: '2025-10-27 08:39:38',
      isFavorite: true,
    },
    {
      id: 3,
      origin: 'Bilbao',
      destination: 'Picos de Europa',
      title: 'Experiencia de Senderismo',
      image: 'https://cdn.bookatrekking.com/data/images/2023/11/naranjo-de-bulnes.jpg',
      description:
        'Ruta guiada por el norte de España. Visita los Picos de Europa y disfruta de la naturaleza.',
      creator_id: 3,
      start_date: '2025-09-05',
      end_date: '2025-09-10',
      estimated_cost: 400.0,
      min_participants: 4,
      transport: 'Furgoneta',
      accommodation: 'Camping',
      itinerary: 'Día 1: Encuentro en Bilbao...',
      status: 'open',
      latitude: 43.2551,
      longitude: -4.6333,
      created_at: '2025-10-27 08:39:38',
      updated_at: '2025-10-27 08:39:38',
      isFavorite: false,
    },
  ];

  usuarios = [
    {
      id: '1',
      avatar:
        'https://img.freepik.com/foto-gratis/estilo-vida-emociones-gente-concepto-casual-confiado-agradable-sonriente-mujer-asiatica-brazos-cruzados-pecho-seguro-listo-ayudar-escuchando-companeros-trabajo-participando-conversacion_1258-59335.jpg?semt=ais_hybrid&w=740&q=80',
      nombre: 'Elena Vargas',
      email: 'elena@viajera.com',
      password: 'hashed_password_1',
      biografia: 'Exploradora de montañas y culturas. Fotógrafa aficionada.',
      fechaNacimiento: '1992-08-20',
      valoracion: 4.5,
    },
    {
      id: '2',
      nombre: 'Marco Diaz',
      avatar:
        'https://img.freepik.com/foto-gratis/chico-guapo-confiado-posando-contra-pared-blanca_176420-32936.jpg?semt=ais_hybrid&w=740&q=80',
      email: 'marco@viajero.com',
      password: 'hashed_password_2',
      biografia:
        'Apasionado por la historia y la gastronomía. Siempre en busca del plato perfecto.',
      fechaNacimiento: '1988-03-12',
      valoracion: 4.2,
    },
    {
      id: '3',
      nombre: 'Kevin Franco',
      avatar:
        'https://media.istockphoto.com/id/1171169099/es/foto/hombre-con-brazos-cruzados-aislados-sobre-fondo-gris.jpg?s=612x612&w=0&k=20&c=8qDLKdLMm2i8DHXY6crX6a5omVh2IxqrOxJV2QGzgFg=',
      email: 'kevin@viajera.com',
      password: 'hashed_password_1',
      biografia: 'Exploradora de montañas y culturas. Fotógrafa aficionada.',
      fechaNacimiento: '1992-08-20',
      valoracion: 4.8,
    },
  ];
}
