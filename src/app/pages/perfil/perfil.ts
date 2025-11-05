import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-perfil',
  imports: [],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil {
  /*  Mantenemos nuestro signal con los datos de ejemplo del usuario */
  public user = signal({
    nombre: 'Kevin Franco' /* Usaremos el nombre de la imagen de inspiración */,
    rating: 4.9,
    reviews: 15,
    profilePhotoUrl: 'https://www.vwa.co.uk/images/team/m1.png',
    biografia: 'Explorador de montañas y culturas. Fotógrafa aficionada.',
    intereses: ['Business', 'Fotografía', 'Cultura Local', 'Mochilero', 'Naturaleza', 'Tecnología'],
  });
}
