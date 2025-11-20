import { Component } from '@angular/core';

@Component({
  selector: 'app-view-ratings',
  imports: [],
  templateUrl: './view-ratings.html',
  styleUrl: './view-ratings.css',
})
export class ViewRatings {
  // Simulación: El usuario cuyo perfil estamos viendo
  usuario = {
    id: 42,
    username: 'Ana Martínez',
    image: 'https://randomuser.me/api/portraits/women/42.jpg',
    valoracionMedia: 4.5,
  };

  // Simulación: Listado de valoraciones recibidas por este usuario
  valoracionesRecibidas = [
    {
      autor: {
        id: 66,
        username: 'Carlos Sánchez',
        image: 'https://randomuser.me/api/portraits/men/65.jpg',
      },
      puntuacion: 5,
      comentario: 'Compañera fenomenal, alegre y muy respetuosa.',
    },
    {
      autor: {
        id: 17,
        username: 'Lucía Guerra',
        image: 'https://randomuser.me/api/portraits/women/15.jpg',
      },
      puntuacion: 4,
      comentario: 'Siempre puntual y con energía positiva.',
    },
    {
      autor: {
        id: 81,
        username: 'Jorge Molina',
        image: 'https://randomuser.me/api/portraits/men/39.jpg',
      },
      puntuacion: 5,
      comentario: 'Inmejorable compañera, repetiría sin dudar.',
    },
    // Puedes añadir más para simular la maquetación
  ];

  getEstrellas(valoracion: number): { icon: string; color: string }[] {
    if (valoracion <= 2) {
      return [
        { icon: 'bi-star-fill', color: 'text-danger' },
        { icon: 'bi-star', color: 'text-secondary' },
        { icon: 'bi-star', color: 'text-secondary' },
      ];
    } else if (valoracion <= 3) {
      return [
        { icon: 'bi-star-fill', color: 'text-warning' },
        { icon: 'bi-star', color: 'text-secondary' },
        { icon: 'bi-star', color: 'text-secondary' },
      ];
    } else if (valoracion <= 4) {
      return [
        { icon: 'bi-star-fill', color: 'text-warning' },
        { icon: 'bi-star-fill', color: 'text-warning' },
        { icon: 'bi-star', color: 'text-secondary' },
      ];
    } else {
      return [
        { icon: 'bi-star-fill', color: 'text-warning' },
        { icon: 'bi-star-fill', color: 'text-warning' },
        { icon: 'bi-star-fill', color: 'text-warning' },
      ];
    }
  }
}
