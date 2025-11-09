import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardViaje } from '../../components/card-viaje/card-viaje';

@Component({
  selector: 'app-landing',
  imports: [CardViaje],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  private intervalId: any;
  currentImageIndex = signal(0);

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
  }

  ngOnDestroy() {
    // Limpiar el intervalo cuando el componente se destruye
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
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
      solicitado: false,
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
      valoracion: 1,
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
