import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardViaje } from '../../components/card-viaje/card-viaje';

@Component({
  selector: 'app-landing',
  imports: [CardViaje],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  // Usamos signals para manejar nuestros arrays de placeholders.
  // Esto nos prepara para cuando los datos vengan de una API.
  public viajesPlaceholder = signal([
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

  public viajesVisibles = signal(6); // Mostrar 6 viajes inicialmente

  public mostrarMasViajes() {
    const actual = this.viajesVisibles();
    const nuevo = Math.min(actual + 6, this.viajesPlaceholder().length);
    this.viajesVisibles.set(nuevo);
  }

  // Hacemos lo mismo para los testimonios.
  public testimonioActual = signal(0); // Controla el grupo de testimonios visible

  public testimonios = signal([
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

  public mostrarSiguientesTestimonios() {
    const actual = this.testimonioActual();
    const siguiente = actual + 3 >= this.testimonios().length ? 0 : actual + 3;
    this.testimonioActual.set(siguiente);
  }

  public mostrarTestimoniosAnteriores() {
    const actual = this.testimonioActual();
    const anterior = actual - 3 < 0 ? this.testimonios().length - 3 : actual - 3;
    this.testimonioActual.set(anterior);
  }
}
