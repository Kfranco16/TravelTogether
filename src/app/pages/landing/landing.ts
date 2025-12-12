import { Component, signal, Inject, ViewChild, ElementRef } from '@angular/core';
import { CardViaje } from '../../components/card-viaje/card-viaje';
import { TripService } from '../../core/services/viajes';
import { AuthService } from '../../core/services/auth';
import { Iuser } from '../../interfaces/iuser';
import { finalize } from 'rxjs';

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
  selector: 'app-landing',
  imports: [CardViaje],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  private intervalId: any;
  currentImageIndex = signal(0);

  trips: Trip[] = [];
  viajesVisibles: Trip[] = [];
  itemsPorPagina: number = 6;
  indiceActuakl: number = 0;

  currentUser: Iuser | null = null;

  busquedaInput = signal('');
  filtroTipoViaje = signal('');
  filtroDuracion = signal('');
  filtroRangoPrecios = signal('');
  ordenamiento = signal('');
  viajesFiltrados = signal<Trip[]>([]);

  private token =
    'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsInVzZXJuYW1lIjoiZWxlbmFnYXJjaWEiLCJlbWFpbCI6ImVsZW5hZ2FyY2lhQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzYyNzAzNTc5LCJleHAiOjE3NjI3MTA3Nzl9.DGinLb3bWqRh2dRY8RvJ-GZqgMzUuHcvS9kb4S6OAMo';

  constructor(
    @Inject(TripService) private tripService: TripService,
    private authservice: AuthService
  ) {}

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

  testimonioActual = signal(0);

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

  @ViewChild('carouselContainer') carouselContainer!: ElementRef<HTMLElement>;
  indiceCarruselRecomendaciones = signal(0);

  recomendacionesViajeros = signal([
    {
      id: 1,
      titulo: 'Prepara tu Documentación',
      descripcion:
        'Asegúrate de tener tu pasaporte vigente, visas necesarias y documentos de viaje con anticipación. Verifica los requisitos específicos del país que visitarás.',
      icono: 'bi-file-earmark-check',
      color: 'primary',
      consejo: 'Fotocopia tus documentos importantes y guárdalos en lugares seguros.',
    },
    {
      id: 2,
      titulo: 'Presupuesto y Finanzas',
      descripcion:
        'Planifica tu presupuesto considerando transporte, alojamiento, comida y actividades. Notifica a tu banco sobre tus viajes internacionales.',
      icono: 'bi-wallet2',
      color: 'success',
      consejo:
        'Lleva múltiples formas de pago: tarjeta de crédito, débito y algo de efectivo local.',
    },
    {
      id: 3,
      titulo: 'Salud y Seguridad',
      descripcion:
        'Consulta con un médico sobre vacunas recomendadas. Compra un seguro de viaje que cubra emergencias médicas y cancelaciones.',
      icono: 'bi-heart-pulse',
      color: 'danger',
      consejo: 'Lleva un botiquín básico con tus medicinas personales y analgésicos.',
    },
    {
      id: 4,
      titulo: 'Empaque Inteligente',
      descripcion:
        'Investiga el clima del destino y prepara una maleta con lo esencial. Deja espacio para souvenirs y recuerdos de tu aventura.',
      icono: 'bi-bag',
      color: 'info',
      consejo:
        'Usa bolsas de compresión para optimizar espacio y deja un cambio extra en el equipaje de mano.',
    },
    {
      id: 5,
      titulo: 'Respeta las Culturas Locales',
      descripcion:
        'Aprende sobre las costumbres y tradiciones del destino. Respeta los horarios locales, la gastronomía y las normas de comportamiento.',
      icono: 'bi-people',
      color: 'warning',
      consejo:
        'Aprende algunas palabras básicas del idioma local. Los locales aprecian el esfuerzo por comunicarse.',
    },
    {
      id: 6,
      titulo: 'Planifica tu Itinerario',
      descripcion:
        'Investiga los principales atractivos, horarios de museos y restaurantes. Pero deja espacio para explorar y descubrir sorpresas.',
      icono: 'bi-map',
      color: 'primary',
      consejo:
        'Descarga mapas offline para no depender de internet. Ten una lista de lugares imprescindibles y otros alternativos.',
    },
    {
      id: 7,
      titulo: 'Cuida tu Privacidad Digital',
      descripcion:
        'Usa VPN en redes wifi públicas, evita compartir información sensible y ten cuidado con los cajeros automáticos.',
      icono: 'bi-shield-check',
      color: 'success',
      consejo:
        'Notifica a tu banco y redes sociales sobre tu viaje. Haz backup de tus fotos y documentos en la nube.',
    },
    {
      id: 8,
      titulo: 'Crea Recuerdos Significativos',
      descripcion:
        'No solo tomes fotos, vive el momento. Interactúa con locales, prueba comida típica y participa en actividades culturales.',
      icono: 'bi-camera',
      color: 'danger',
      consejo:
        'Guarda sobres de sal, servilletas o pequeños objetos que te recuerden el viaje. Mantén un diario o blog.',
    },
  ]);

  moverCarrusel(direccion: 'izquierda' | 'derecha'): void {
    if (!this.carouselContainer) return;

    const container = this.carouselContainer.nativeElement;
    const anchoVisible = container.clientWidth;
    const scrollActual = container.scrollLeft;
    const scrollTotal = container.scrollWidth;
    const tolerancia = 10;

    let nuevaPosicion: number;

    if (direccion === 'derecha') {
      if (scrollActual + anchoVisible >= scrollTotal - tolerancia) {
        nuevaPosicion = 0;
      } else {
        nuevaPosicion = scrollActual + anchoVisible;
      }
    } else {
      if (scrollActual <= tolerancia) {
        nuevaPosicion = scrollTotal;
      } else {
        nuevaPosicion = scrollActual - anchoVisible;
      }
    }

    container.scrollTo({
      left: nuevaPosicion,
      behavior: 'smooth',
    });
  }

  alHacerScroll(event: Event): void {
    const container = event.target as HTMLElement;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;

    const tarjeta = container.querySelector('.carousel-card');
    if (tarjeta) {
      const anchoTarjeta = tarjeta.clientWidth + 24;
      const centroPantalla = scrollLeft + containerWidth / 2;
      const nuevoIndice = Math.floor(centroPantalla / anchoTarjeta);

      if (this.indiceCarruselRecomendaciones() !== nuevoIndice) {
        const max = this.recomendacionesViajeros().length - 1;
        this.indiceCarruselRecomendaciones.set(Math.min(Math.max(nuevoIndice, 0), max));
      }
    }
  }

  irARecomendacion(indice: number): void {
    if (!this.carouselContainer) return;
    const container = this.carouselContainer.nativeElement;
    const tarjeta = container.querySelectorAll('.carousel-card')[indice] as HTMLElement;

    if (tarjeta) {
      const tarjetaLeft = tarjeta.offsetLeft;
      const tarjetaWidth = tarjeta.clientWidth;
      const containerWidth = container.clientWidth;

      const posicionCentrada = tarjetaLeft - containerWidth / 2 + tarjetaWidth / 2;

      container.scrollTo({ left: posicionCentrada, behavior: 'smooth' });
    }
  }

  get isAuthenticated(): boolean {
    return this.authservice.isAuth();
  }

  extraerKeywords(trip: Trip): string[] {
    const keywords: string[] = [];

    if (trip.destination) {
      keywords.push(this.normalizarTexto(trip.destination));
    }

    if (trip.origin) {
      keywords.push(this.normalizarTexto(trip.origin));
    }

    if (trip.title) {
      keywords.push(this.normalizarTexto(trip.title));
    }

    if (trip.description) {
      const palabrasDescripcion = trip.description
        .split(/\s+/)
        .map((palabra) => this.normalizarTexto(palabra))
        .filter((palabra) => palabra.length > 2);
      keywords.push(...palabrasDescripcion);
    }

    if (trip.transport) {
      keywords.push(this.normalizarTexto(trip.transport));
    }

    if (trip.accommodation) {
      keywords.push(this.normalizarTexto(trip.accommodation));
    }

    return [...new Set(keywords)];
  }

  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private coincideConBusqueda(keyword: string, busqueda: string): boolean {
    if (!busqueda) {
      return true;
    }
    return keyword.includes(busqueda);
  }

  private calcularDuracionViaje(trip: Trip): number {
    if (!trip.start_date || !trip.end_date) {
      return 0;
    }
    const fechaInicio = new Date(trip.start_date).getTime();
    const fechaFin = new Date(trip.end_date).getTime();
    const duracionMs = fechaFin - fechaInicio;
    return Math.ceil(duracionMs / (1000 * 60 * 60 * 24));
  }

  private cumpleFiltoDuracion(trip: Trip): boolean {
    const filtroDuracion = this.filtroDuracion();

    if (!filtroDuracion) {
      return true;
    }

    const duracion = this.calcularDuracionViaje(trip);

    switch (filtroDuracion) {
      case 'corta':
        return duracion >= 1 && duracion <= 7;
      case 'media':
        return duracion >= 8 && duracion <= 14;
      case 'larga':
        return duracion >= 15;
      default:
        return true;
    }
  }

  private cumpleFiltroTipo(trip: Trip): boolean {
    const filtroTipo = this.filtroTipoViaje();

    if (!filtroTipo) {
      return true;
    }

    return trip.status?.toLowerCase() === filtroTipo.toLowerCase();
  }

  private aplicarOrdenamiento(viajes: Trip[]): Trip[] {
    const opcionOrdenamiento = this.ordenamiento();

    if (!opcionOrdenamiento) {
      return viajes;
    }

    const viajesOrdenados = [...viajes];

    switch (opcionOrdenamiento) {
      case 'precio-asc':
        return viajesOrdenados.sort((a, b) => {
          const precioA = parseInt(a.estimated_cost || '0', 10);
          const precioB = parseInt(b.estimated_cost || '0', 10);
          return precioA - precioB;
        });
      case 'fecha-asc':
        return viajesOrdenados.sort((a, b) => {
          const fechaA = new Date(a.start_date || '').getTime();
          const fechaB = new Date(b.start_date || '').getTime();
          return fechaA - fechaB;
        });
      default:
        return viajesOrdenados;
    }
  }

  private cumpleFiltroPrecio(trip: Trip): boolean {
    const rangoPrecios = this.filtroRangoPrecios();

    if (!rangoPrecios) {
      return true;
    }

    const precioViaje = parseInt(trip.estimated_cost || '0', 10);

    switch (rangoPrecios) {
      case '0-500':
        return precioViaje >= 0 && precioViaje <= 500;
      case '500-1000':
        return precioViaje > 500 && precioViaje <= 1000;
      case '1000-2000':
        return precioViaje > 1000 && precioViaje <= 2000;
      case '2000+':
        return precioViaje > 2000;
      default:
        return true;
    }
  }

  filtrarYBuscarViajes(): void {
    const busquedaActual = this.normalizarTexto(this.busquedaInput());

    const viajeFiltrados = this.trips.filter((trip) => {
      if (!this.cumpleFiltroTipo(trip)) {
        return false;
      }

      if (!this.cumpleFiltoDuracion(trip)) {
        return false;
      }

      if (!this.cumpleFiltroPrecio(trip)) {
        return false;
      }

      if (!busquedaActual) {
        return true;
      }

      const keywords = this.extraerKeywords(trip);

      return keywords.some((keyword) => this.coincideConBusqueda(keyword, busquedaActual));
    });

    const viajesOrdenados = this.aplicarOrdenamiento(viajeFiltrados);

    this.viajesFiltrados.set(viajesOrdenados);

    this.indiceActuakl = 0;
    this.viajesVisibles = [];

    this.actualizarPaginacionFiltrada();
  }

  actualizarPaginacionFiltrada(): void {
    const viajesFiltrados = this.viajesFiltrados();
    const indiceFinal = this.indiceActuakl + this.itemsPorPagina;
    this.viajesVisibles = viajesFiltrados.slice(0, indiceFinal);
  }

  onBusquedaChange(evento: Event): void {
    const valorInput = (evento.target as HTMLInputElement).value;
    this.busquedaInput.set(valorInput);
    this.filtrarYBuscarViajes();
  }

  onFiltroTipoChange(evento: Event): void {
    const valorSelect = (evento.target as HTMLSelectElement).value;
    this.filtroTipoViaje.set(valorSelect);
    this.filtrarYBuscarViajes();
  }

  onFiltroDuracionChange(evento: Event): void {
    const valorSelect = (evento.target as HTMLSelectElement).value;
    this.filtroDuracion.set(valorSelect);
    this.filtrarYBuscarViajes();
  }

  onFiltroRangoPreciosChange(evento: Event): void {
    const valorSelect = (evento.target as HTMLSelectElement).value;
    this.filtroRangoPrecios.set(valorSelect);
    this.filtrarYBuscarViajes();
  }

  onOrdenamientoChange(evento: Event): void {
    const valorSelect = (evento.target as HTMLSelectElement).value;
    this.ordenamiento.set(valorSelect);
    this.filtrarYBuscarViajes();
  }

  mostrarMasViajes(): void {
    const viajesAlMostrar = this.viajesFiltrados().length > 0 ? this.viajesFiltrados() : this.trips;

    this.indiceActuakl += this.itemsPorPagina;

    const indiceFinal = this.indiceActuakl + this.itemsPorPagina;

    this.viajesVisibles = viajesAlMostrar.slice(0, indiceFinal);
  }

  get hayMasViajes(): boolean {
    const viajesBase = this.viajesFiltrados().length > 0 ? this.viajesFiltrados() : this.trips;
    return this.viajesVisibles.length < viajesBase.length;
  }

  visibleTrips: Trip[] = [];
  isLoadingTrips = false;
  hasTripsError = false;

  loadTrips() {
    this.isLoadingTrips = true;
    this.hasTripsError = false;

    this.tripService
      .getTrips(this.token)
      .pipe(finalize(() => (this.isLoadingTrips = false)))
      .subscribe({
        next: (data: any) => {
          this.visibleTrips = data.results || data;
        },
        error: () => {
          this.hasTripsError = true;
        },
      });
  }

  ngOnInit() {
    this.loadTrips();

    this.intervalId = setInterval(() => {
      const nextIndex = (this.currentImageIndex() + 1) % this.heroImages().length;
      this.currentImageIndex.set(nextIndex);
    }, 5000);

    this.tripService.loadAllTrips(this.token).subscribe({
      next: (allTrips: Trip[]) => {
        this.trips = allTrips;
        this.viajesFiltrados.set(this.trips);
        this.actualizarPaginacionFiltrada();
      },
      error: (err: any) => {
        const errorMsg = err?.error?.message || err?.message || 'Error desconocido';
        alert('No pudimos cargar los viajes. Intenta recargar la página.');
      },
    });

    this.authservice.user$.subscribe({
      next: (user) => {
        this.currentUser = user;
      },
    });
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
