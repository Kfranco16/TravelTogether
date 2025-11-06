import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card-usuario',
  standalone: true,
  templateUrl: './card-usuario.html',
  styleUrl: './card-usuario.css',
})
export class CardUsuario {
  @Input() usuario!: any;

  getUsuarioById(id: number): any | undefined {
    return this.usuarios.find((user) => user.id === id.toString());
  }

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

  usuarios = [
    {
      id: '1',
      avatar: 'https://i.pravatar.cc/500?u=norma.torresnevarez@peticiones.online"',
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
      avatar: 'https://placehold.co/60x60',
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
      avatar: 'https://placehold.co/60x60',
      email: 'kevin@viajera.com',
      password: 'hashed_password_1',
      biografia: 'Exploradora de montañas y culturas. Fotógrafa aficionada.',
      fechaNacimiento: '1992-08-20',
      valoracion: 4.8,
    },
  ];
}
