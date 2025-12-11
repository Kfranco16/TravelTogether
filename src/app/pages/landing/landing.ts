import { Component, signal, Inject, ViewChild, ElementRef } from '@angular/core';
import { CardViaje } from '../../components/card-viaje/card-viaje';
import { TripService } from '../../core/services/viajes';
import { AuthService } from '../../core/services/auth';
import { Iuser } from '../../interfaces/iuser';
import { finalize, finalize as rxFinalize } from 'rxjs';

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
  latitude?: number; // Change to string to match the API response
  longitude?: number; // Change to string to match the API response
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

  // ==================== DATOS PRINCIPALES ====================
  // Array que almacena todos los viajes obtenidos del servicio
  trips: Trip[] = [];
  // Array que muestra solo los viajes que cumplen con búsqueda y paginación
  viajesVisibles: Trip[] = [];
  // Cantidad de viajes a mostrar por página
  itemsPorPagina: number = 6;
  // Índice actual para la paginación
  indiceActuakl: number = 0;

  currentUser: Iuser | null = null;

  // ==================== SIGNALS PARA BÚSQUEDA Y FILTRADO ====================
  // Signal que almacena la palabra clave ingresada por el usuario en el input de búsqueda
  busquedaInput = signal('');

  // Signal que almacena el tipo de viaje seleccionado en el filtro dropdown
  filtroTipoViaje = signal('');

  // Signal que almacena la duración seleccionada en el filtro dropdown
  filtroDuracion = signal('');

  // Signal que almacena el rango de precio seleccionado (ej: "0-500", "500-1000", etc)
  // Valores predefinidos: '', '0-500', '500-1000', '1000-2000', '2000+'
  filtroRangoPrecios = signal('');

  // Signal que almacena la opción de ordenamiento seleccionada
  // Valores predefinidos: '', 'precio-asc', 'fecha-asc'
  ordenamiento = signal('');

  // Signal que almacena todos los viajes después de aplicar filtros y búsqueda
  viajesFiltrados = signal<Trip[]>([]);

  // Sustituye esto por el sistema real de manejo de tokens en producción
  private token =
    'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsInVzZXJuYW1lIjoiZWxlbmFnYXJjaWEiLCJlbWFpbCI6ImVsZW5hZ2FyY2lhQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzYyNzAzNTc5LCJleHAiOjE3NjI3MTA3Nzl9.DGinLb3bWqRh2dRY8RvJ-GZqgMzUuHcvS9kb4S6OAMo'; // tu token completo
  constructor(
    @Inject(TripService) private tripService: TripService,
    private authservice: AuthService
  ) {}

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

  // ==================== RECOMENDACIONES PARA VIAJEROS ====================
  // Signal que controla la posición actual del carrusel de recomendaciones
  @ViewChild('carouselContainer') carouselContainer!: ElementRef<HTMLElement>;
  indiceCarruselRecomendaciones = signal(0);

  // Signal que almacena 8 posts de recomendaciones para usuarios autenticados
  // Cada post contiene un título, descripción, icono y consejo práctico
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

  /**
   * Lógica de Carrusel Infinito (Circular) para botones
   */
  moverCarrusel(direccion: 'izquierda' | 'derecha'): void {
    if (!this.carouselContainer) return;

    const container = this.carouselContainer.nativeElement;
    const anchoVisible = container.clientWidth;
    const scrollActual = container.scrollLeft;
    const scrollTotal = container.scrollWidth; // Ancho total de todo el contenido

    // Margen de error para comparación de floats
    const tolerancia = 10;

    let nuevaPosicion: number;

    if (direccion === 'derecha') {
      // Si estamos al final (scroll actual + ancho visible >= total), volvemos al inicio (0)
      if (scrollActual + anchoVisible >= scrollTotal - tolerancia) {
        nuevaPosicion = 0;
      } else {
        nuevaPosicion = scrollActual + anchoVisible;
      }
    } else {
      // Izquierda
      // Si estamos al principio (cerca de 0), vamos al final
      if (scrollActual <= tolerancia) {
        nuevaPosicion = scrollTotal; // Ir al final
      } else {
        nuevaPosicion = scrollActual - anchoVisible;
      }
    }

    container.scrollTo({
      left: nuevaPosicion,
      behavior: 'smooth',
    });
  }

  /**
   * Detectar índice centralizado al hacer scroll
   */
  alHacerScroll(event: Event): void {
    const container = event.target as HTMLElement;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth; // Ancho visible

    const tarjeta = container.querySelector('.carousel-card');
    if (tarjeta) {
      const anchoTarjeta = tarjeta.clientWidth + 24; // Ancho + Gap

      // Fórmula ajustada para centrado:
      // Sumamos la mitad del contenedor al scroll para encontrar el punto central
      const centroPantalla = scrollLeft + containerWidth / 2;

      // Dividimos ese punto central entre el ancho de la tarjeta
      // (Restamos medio ancho de tarjeta para ajustar el offset inicial si es necesario)
      const nuevoIndice = Math.floor(centroPantalla / anchoTarjeta);

      if (this.indiceCarruselRecomendaciones() !== nuevoIndice) {
        const max = this.recomendacionesViajeros().length - 1;
        // Aseguramos que el índice sea válido
        this.indiceCarruselRecomendaciones.set(Math.min(Math.max(nuevoIndice, 0), max));
      }
    }
  }

  irARecomendacion(indice: number): void {
    if (!this.carouselContainer) return;
    const container = this.carouselContainer.nativeElement;
    const tarjeta = container.querySelectorAll('.carousel-card')[indice] as HTMLElement;

    if (tarjeta) {
      // Cálculo para centrar el elemento seleccionado
      // Posición deseada = PosiciónElemento - (MitadPantalla - MitadElemento)
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

  // ==================== MÉTODOS DE BÚSQUEDA Y FILTRADO ====================

  /**
   * Extrae palabras clave de un viaje individual
   * Genera un array de términos basados en múltiples campos del viaje
   * Se usa para hacer búsquedas más precisas y comparativas
   * @param trip - El viaje del cual extraer palabras clave
   * @returns Array de strings con palabras clave normalizadas (minúsculas, sin tildes)
   */
  extraerKeywords(trip: Trip): string[] {
    const keywords: string[] = [];

    // Agregar destino si existe (campo principal para búsqueda)
    if (trip.destination) {
      keywords.push(this.normalizarTexto(trip.destination));
    }

    // Agregar origen si existe
    if (trip.origin) {
      keywords.push(this.normalizarTexto(trip.origin));
    }

    // Agregar título del viaje
    if (trip.title) {
      keywords.push(this.normalizarTexto(trip.title));
    }

    // Agregar descripción dividida en palabras individuales
    if (trip.description) {
      const palabrasDescripcion = trip.description
        .split(/\s+/) // Separar por espacios
        .map((palabra) => this.normalizarTexto(palabra))
        .filter((palabra) => palabra.length > 2); // Filtrar palabras muy cortas
      keywords.push(...palabrasDescripcion);
    }

    // Agregar tipo de transporte como palabra clave
    if (trip.transport) {
      keywords.push(this.normalizarTexto(trip.transport));
    }

    // Agregar tipo de alojamiento como palabra clave
    if (trip.accommodation) {
      keywords.push(this.normalizarTexto(trip.accommodation));
    }

    // Retornar array sin duplicados usando Set
    return [...new Set(keywords)];
  }

  /**
   * Normaliza texto para búsquedas
   * Convierte a minúsculas y remueve acentos y caracteres especiales
   * @param texto - Texto a normalizar
   * @returns String normalizado y listo para comparación
   */
  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase() // Convertir a minúsculas
      .normalize('NFD') // Descomponer caracteres con acentos
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .trim(); // Remover espacios al inicio y final
  }

  /**
   * Verifica si una palabra clave coincide con el término de búsqueda
   * Utiliza búsqueda parcial (substring matching)
   * @param keyword - Palabra clave a verificar
   * @param busqueda - Término de búsqueda del usuario
   * @returns true si la palabra clave contiene el término de búsqueda
   */
  private coincideConBusqueda(keyword: string, busqueda: string): boolean {
    // Si no hay búsqueda, todos coinciden
    if (!busqueda) {
      return true;
    }
    // Verificar si la palabra clave contiene el término de búsqueda (parcial)
    return keyword.includes(busqueda);
  }

  /**
   * Calcula la duración en días de un viaje basándose en las fechas
   * @param trip - Viaje del cual calcular duración
   * @returns Número de días entre start_date y end_date
   */
  private calcularDuracionViaje(trip: Trip): number {
    if (!trip.start_date || !trip.end_date) {
      return 0;
    }
    const fechaInicio = new Date(trip.start_date).getTime();
    const fechaFin = new Date(trip.end_date).getTime();
    const duracionMs = fechaFin - fechaInicio;
    return Math.ceil(duracionMs / (1000 * 60 * 60 * 24)); // Convertir ms a días
  }

  /**
   * Verifica si un viaje cumple con el filtro de duración seleccionado
   * @param trip - Viaje a verificar
   * @returns true si cumple con el filtro de duración
   */
  private cumpleFiltoDuracion(trip: Trip): boolean {
    const filtroDuracion = this.filtroDuracion();

    // Si no hay filtro, todos los viajes pasan
    if (!filtroDuracion) {
      return true;
    }

    const duracion = this.calcularDuracionViaje(trip);

    // Aplicar diferentes rangos de duración según el filtro
    switch (filtroDuracion) {
      case 'corta': // 1-7 días
        return duracion >= 1 && duracion <= 7;
      case 'media': // 8-14 días
        return duracion >= 8 && duracion <= 14;
      case 'larga': // 15+ días
        return duracion >= 15;
      default:
        return true;
    }
  }

  /**
   * Verifica si un viaje cumple con el filtro de tipo de viaje seleccionado
   * @param trip - Viaje a verificar
   * @returns true si cumple con el filtro de tipo
   */
  private cumpleFiltroTipo(trip: Trip): boolean {
    const filtroTipo = this.filtroTipoViaje();

    // Si no hay filtro, todos los viajes pasan
    if (!filtroTipo) {
      return true;
    }

    // Comparar con el campo status o descripción del viaje
    return trip.status?.toLowerCase() === filtroTipo.toLowerCase();
  }

  /**
   * Aplica el ordenamiento a los viajes filtrados
   * Organiza los viajes según la opción de ordenamiento seleccionada
   * @param viajes - Array de viajes a ordenar
   * @returns Array de viajes ordenados según la opción seleccionada
   */
  private aplicarOrdenamiento(viajes: Trip[]): Trip[] {
    const opcionOrdenamiento = this.ordenamiento();

    // Si no hay ordenamiento seleccionado, retornar el array sin cambios
    if (!opcionOrdenamiento) {
      return viajes;
    }

    // Crear una copia del array para no modificar el original
    const viajesOrdenados = [...viajes];

    // Aplicar el ordenamiento según la opción seleccionada
    switch (opcionOrdenamiento) {
      case 'precio-asc':
        // Ordenar por precio de menor a mayor
        return viajesOrdenados.sort((a, b) => {
          const precioA = parseInt(a.estimated_cost || '0', 10);
          const precioB = parseInt(b.estimated_cost || '0', 10);
          return precioA - precioB; // Ascendente (menor a mayor)
        });
      case 'fecha-asc':
        // Ordenar por fecha de inicio de viaje (menor a mayor)
        return viajesOrdenados.sort((a, b) => {
          const fechaA = new Date(a.start_date || '').getTime();
          const fechaB = new Date(b.start_date || '').getTime();
          return fechaA - fechaB; // Ascendente (fechas más próximas primero)
        });
      default:
        // Si no hay opción válida, retornar sin ordenamiento
        return viajesOrdenados;
    }
  }

  /**
   * Verifica si un viaje cumple con el filtro de rango de precios
   * Valida que el precio estimado del viaje esté dentro del rango especificado
   * @param trip - Viaje a verificar
   * @returns true si el precio cumple con el rango especificado
   */
  private cumpleFiltroPrecio(trip: Trip): boolean {
    const rangoPrecios = this.filtroRangoPrecios();

    // Si no hay filtro de precio, todos los viajes pasan
    if (!rangoPrecios) {
      return true;
    }

    // Obtener el precio estimado del viaje (parsearlo como número)
    const precioViaje = parseInt(trip.estimated_cost || '0', 10);

    // Aplicar filtro según el rango seleccionado
    switch (rangoPrecios) {
      case '0-500':
        // Rango: $0 a $500
        return precioViaje >= 0 && precioViaje <= 500;
      case '500-1000':
        // Rango: $500 a $1000
        return precioViaje > 500 && precioViaje <= 1000;
      case '1000-2000':
        // Rango: $1000 a $2000
        return precioViaje > 1000 && precioViaje <= 2000;
      case '2000+':
        // Rango: $2000 en adelante
        return precioViaje > 2000;
      default:
        // Si no hay rango válido, aceptar el viaje
        return true;
    }
  }

  /**
   * MÉTODO PRINCIPAL: Filtra y busca viajes según criterios del usuario
   * Integra: búsqueda por palabras clave + filtros por tipo y duración + rango de precio
   * Actualiza automáticamente viajesFiltrados y reinicia la paginación
   */
  filtrarYBuscarViajes(): void {
    // Obtener valores actuales de los signals
    const busquedaActual = this.normalizarTexto(this.busquedaInput());

    // Filtrar el array de viajes según criterios
    const viajeFiltrados = this.trips.filter((trip) => {
      // Paso 1: Verificar que cumpla filtro de tipo
      if (!this.cumpleFiltroTipo(trip)) {
        return false;
      }

      // Paso 2: Verificar que cumpla filtro de duración
      if (!this.cumpleFiltoDuracion(trip)) {
        return false;
      }

      // Paso 3: Verificar que cumpla filtro de rango de precio
      if (!this.cumpleFiltroPrecio(trip)) {
        return false;
      }

      // Paso 4: Si no hay búsqueda, el viaje ya pasó todos los filtros
      if (!busquedaActual) {
        return true;
      }

      // Paso 5: Extraer palabras clave del viaje
      const keywords = this.extraerKeywords(trip);

      // Paso 6: Verificar si alguna palabra clave coincide con la búsqueda
      return keywords.some((keyword) => this.coincideConBusqueda(keyword, busquedaActual));
    });

    // Aplicar ordenamiento a los viajes filtrados
    const viajesOrdenados = this.aplicarOrdenamiento(viajeFiltrados);

    // Actualizar el signal con los viajes filtrados y ordenados
    this.viajesFiltrados.set(viajesOrdenados);

    // Reiniciar la paginación después de filtrar
    this.indiceActuakl = 0;
    this.viajesVisibles = [];

    // Mostrar los primeros viajes de los resultados filtrados
    this.actualizarPaginacionFiltrada();
  }

  /**
   * Actualiza la visualización de viajes después de un filtro
   * Aplica la lógica de paginación al array filtrado
   * Se ejecuta después de cada búsqueda o cambio de filtros
   */
  actualizarPaginacionFiltrada(): void {
    // Obtener viajes filtrados del signal
    const viajesFiltrados = this.viajesFiltrados();

    // Calcular el índice final para este bloque
    const indiceFinal = this.indiceActuakl + this.itemsPorPagina;

    // Extraer solo los viajes del rango actual (paginación)
    this.viajesVisibles = viajesFiltrados.slice(0, indiceFinal);
  }

  /**
   * Maneja el evento de cambio en el input de búsqueda
   * Se ejecuta cada vez que el usuario escribe en el campo de búsqueda
   * @param evento - Evento del input con el valor actual
   */
  onBusquedaChange(evento: Event): void {
    const valorInput = (evento.target as HTMLInputElement).value;
    // Actualizar el signal de búsqueda
    this.busquedaInput.set(valorInput);
    // Ejecutar filtrado inmediatamente
    this.filtrarYBuscarViajes();
  }

  /**
   * Maneja el evento de cambio en el selector de tipo de viaje
   * @param evento - Evento del select con el valor seleccionado
   */
  onFiltroTipoChange(evento: Event): void {
    const valorSelect = (evento.target as HTMLSelectElement).value;
    // Actualizar el signal del filtro
    this.filtroTipoViaje.set(valorSelect);
    // Ejecutar filtrado inmediatamente
    this.filtrarYBuscarViajes();
  }

  /**
   * Maneja el evento de cambio en el selector de duración
   * @param evento - Evento del select con el valor seleccionado
   */
  onFiltroDuracionChange(evento: Event): void {
    const valorSelect = (evento.target as HTMLSelectElement).value;
    // Actualizar el signal del filtro
    this.filtroDuracion.set(valorSelect);
    // Ejecutar filtrado inmediatamente
    this.filtrarYBuscarViajes();
  }

  /**
   * Maneja el evento de cambio en el selector de rango de precios
   * Se ejecuta cuando el usuario selecciona un rango de precio predefinido
   * @param evento - Evento del select con el rango seleccionado
   */
  onFiltroRangoPreciosChange(evento: Event): void {
    const valorSelect = (evento.target as HTMLSelectElement).value;
    // Actualizar el signal del rango de precios
    this.filtroRangoPrecios.set(valorSelect);
    // Ejecutar filtrado inmediatamente
    this.filtrarYBuscarViajes();
  }

  /**
   * Maneja el evento de cambio en el selector de ordenamiento
   * Se ejecuta cuando el usuario selecciona una opción de ordenamiento
   * @param evento - Evento del select con la opción de ordenamiento
   */
  onOrdenamientoChange(evento: Event): void {
    const valorSelect = (evento.target as HTMLSelectElement).value;
    // Actualizar el signal de ordenamiento
    this.ordenamiento.set(valorSelect);
    // Ejecutar filtrado y ordenamiento inmediatamente
    this.filtrarYBuscarViajes();
  }

  /**
   * Muestra más viajes al presionar el botón "Mostrar más"
   * Incrementa el índice de paginación e integra con los filtros activos
   */
  mostrarMasViajes(): void {
    // Obtener viajes filtrados (si hay búsqueda activa) o todos los viajes
    const viajesAlMostrar = this.viajesFiltrados().length > 0 ? this.viajesFiltrados() : this.trips;

    // Incrementar el índice para la siguiente "página"
    this.indiceActuakl += this.itemsPorPagina;

    // Calcular el nuevo rango de viajes a mostrar
    const indiceFinal = this.indiceActuakl + this.itemsPorPagina;

    // Actualizar viajesVisibles con el nuevo rango
    this.viajesVisibles = viajesAlMostrar.slice(0, indiceFinal);
  }

  /**
   * Getter que verifica si hay más viajes para mostrar
   * Útil para mostrar/ocultar el botón "Mostrar más"
   * @returns true si hay más viajes disponibles
   */
  get hayMasViajes(): boolean {
    // Obtener viajes base (filtrados o todos)
    const viajesBase = this.viajesFiltrados().length > 0 ? this.viajesFiltrados() : this.trips;

    // Comparar cantidad visible vs total disponible
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
        error: (err) => {
          this.hasTripsError = true;
        },
      });
  }

  ngOnInit() {
    this.loadTrips();
    // Iniciar la rotación automática de imágenes cada 5 segundos
    this.intervalId = setInterval(() => {
      const nextIndex = (this.currentImageIndex() + 1) % this.heroImages().length;
      this.currentImageIndex.set(nextIndex);
    }, 5000);

    // Cargar todos los viajes (maneja paginación, consolidación y caché automáticamente)
    this.tripService.loadAllTrips(this.token).subscribe({
      next: (allTrips: Trip[]) => {
        // Los viajes ya están completamente cargados (todas las páginas)
        this.trips = allTrips;

        // Inicializar los viajes filtrados con todos los viajes disponibles
        this.viajesFiltrados.set(this.trips);

        // Mostrar los primeros viajes (primeros 6 items)
        this.actualizarPaginacionFiltrada();
      },
      error: (err: any) => {
        // Manejo de errores del servicio
        const errorMsg = err?.error?.message || err?.message || 'Error desconocido';

        // Mostrar feedback al usuario (opcional)
        alert('No pudimos cargar los viajes. Intenta recargar la página.');
      },
    });

    // Suscribirse a cambios de usuario autenticado
    this.authservice.user$.subscribe({
      next: (user) => {
        this.currentUser = user;
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
