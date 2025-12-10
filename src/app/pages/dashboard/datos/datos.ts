import { Component } from '@angular/core';
import { Registro } from '../../registro/registro';
import { AuthService } from '../../../core/services/auth';
import { Iuser } from '../../../interfaces/iuser';

@Component({
  selector: 'app-datos',
  standalone: true,
  imports: [Registro],
  templateUrl: './datos.html',
  styleUrl: './datos.css',
})
export class Datos {
  currentUser: Iuser | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
  }
}
