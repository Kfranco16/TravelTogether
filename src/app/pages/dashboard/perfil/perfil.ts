import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth';
import { Iuser } from '../../../interfaces/iuser';

@Component({
  selector: 'app-perfil',
  standalone: true,
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css'],
})
export class Perfil {
  private auth = inject(AuthService);

  user: Iuser | null = this.auth.getCurrentUser();
  defaultAvatar = 'https://i.pravatar.cc/120?u=traveltogether';
}
