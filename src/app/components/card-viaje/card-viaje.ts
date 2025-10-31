import { Component } from '@angular/core';

@Component({
  selector: 'app-card-viaje',
  imports: [],
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
    case 'open': return 'bg-success';
    case 'draft': return 'bg-danger';
    default: return 'bg-secondary';
  }
}

getBadgeText(status: string): string {
  switch (status) {
    case 'open': return 'Abierto';
    case 'draft': return 'Últimos días';
    default: return status;
  }
}

// toggleFavorito(trip: Trip) {
//   // Cambia el estado local
//   trip.isFavorite = !trip.isFavorite;

//   // Aquí puedes añadir la petición a la API si quieres guardar favorito en el servidor:
//   // this.miServicioViajes.guardarFavorito(trip.id, trip.isFavorite).subscribe(...);
// }

getFavoriteIconClass(isFavorite: boolean): string {
  return isFavorite ? 'bi-heart-fill text-danger' : 'bi-heart text-white';
}


trips = [
  {
    id: 1,
    origin: "Barcelona",
    destination: "Lisboa",
    title: "Aventura Costera",
    image: "https://content-viajes.nationalgeographic.com.es/medio/2024/11/07/alfama_151256d3_241107153719_1200x800.webp",
    description: "Un viaje de 5 días recorriendo la costa ibérica.",
    creator_id: 1,
    start_date: "2025-11-11",
    end_date: "2025-11-25",
    estimated_cost: 450.00,
    min_participants: 3,
    transport: "Coche",
    accommodation: "Hostal",
    itinerary: "Día 1: Salida hacia Valencia, Día 2: Alicante...",
    status: "open",
    latitude: 38.71690000,
    longitude: -9.13990000,
    created_at: "2025-10-27 08:39:38",
    updated_at: "2025-10-27 08:39:38"
  },
  {
    id: 2,
    origin: "Madrid",
    destination: "Granada",
    title: "Escapada Cultural",
    image:"https://content.r9cdn.net/rimg/dimg/3b/c2/b4c4bfb9-city-27138-55689ae0.jpg",
    description: "Visita a la Alhambra y degustación de comida andaluza.",
    creator_id: 2,
    start_date: "2025-08-01",
    end_date: "2025-08-05",
    estimated_cost: 300.00,
    min_participants: 2,
    transport: "Tren",
    accommodation: "Hotel",
    itinerary: "Día 1: Llegada, Día 2: Recorrido por la ciudad...",
    status: "open",
    latitude: 37.17730000,
    longitude: -3.59860000,
    created_at: "2025-10-27 08:39:38",
    updated_at: "2025-10-27 08:39:38"
  },
  {
    id: 3,
    origin: "Bilbao",
    destination: "Picos de Europa",
    title: "Experiencia de Senderismo",
    image: "https://cdn.bookatrekking.com/data/images/2023/11/naranjo-de-bulnes.jpg",
    description: "Ruta guiada por el norte de España.",
    creator_id: 3,
    start_date: "2025-09-05",
    end_date: "2025-09-10",
    estimated_cost: 400.00,
    min_participants: 4,
    transport: "Furgoneta",
    accommodation: "Camping",
    itinerary: "Día 1: Encuentro en Bilbao...",
    status: "open",
    latitude: 43.25510000,
    longitude: -4.63330000,
    created_at: "2025-10-27 08:39:38",
    updated_at: "2025-10-27 08:39:38"
  },
  
]
  
}

