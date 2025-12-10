import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, filter } from 'rxjs';

import { AuthService } from '../../../core/services/auth';
import { NotificationsService, NotificationDto } from '../../../core/services/notifications';
import { Logo } from '../logo/logo';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, Logo],
})
export class Navbar implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private notificationsService = inject(NotificationsService);

  private routerSub?: Subscription;
  private authSub?: Subscription;
  public router: Router = inject(Router);
  showMobileSpace = false;

  toggleMobileSpace() {
    this.showMobileSpace = !this.showMobileSpace;
  }

  open = false;
  isAuthenticated = false;
  currentUser: { id: number; username?: string; image?: string } | null = null;

  hasNotifications = false;
  notificaciones: NotificationDto[] = [];

  notif = {
    perfil: false,
    datos: false,
    favoritos: false,
    notificaciones: false,
    gestionViajes: false,
  };

  ngOnInit(): void {
    this.authSub = this.authService.user$.subscribe((user) => {
      this.currentUser = user;
      this.isAuthenticated = !!user;

      if (this.isAuthenticated) {
        this.cargarNotificaciones();

        if (!this.routerSub) {
          this.routerSub = this.router.events
            .pipe(filter((e) => e instanceof NavigationEnd))
            .subscribe(() => {
              this.cargarNotificaciones();
            });
        }
      } else {
        this.resetFlags();
        this.notificaciones = [];
        this.routerSub?.unsubscribe();
        this.routerSub = undefined;
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.authSub?.unsubscribe();
  }

  onToggleOpen(): void {
    this.open = !this.open;
  }

  onOpen(): void {
    this.open = true;
  }

  onClose(): void {
    this.open = false;
  }

  private resetFlags(): void {
    this.notif = {
      perfil: false,
      datos: false,
      gestionViajes: false,
      favoritos: false,
      notificaciones: false,
    };
    this.hasNotifications = false;
  }

  private actualizarFlagsDesdeNotifications(): void {
    this.resetFlags();

    if (this.notificaciones.length === 0) {
      return;
    }

    for (const n of this.notificaciones) {
      switch (n.type) {
        case 'message':
          this.notif.gestionViajes = true;
          break;
        case 'trip':
          this.notif.gestionViajes = true;
          break;
        case 'favorites':
          this.notif.favoritos = true;
          break;
        case 'group':
          this.notif.gestionViajes = true;
          break;
      }
    }

    this.notif.notificaciones = true;
    this.hasNotifications = Object.values(this.notif).some((v) => v);
  }

  private cargarNotificaciones(): void {
    const token = this.authService.gettoken() || '';
    const currentUser = this.currentUser;
    if (!token || !currentUser) {
      this.resetFlags();
      return;
    }

    this.notificationsService.getAll(token).subscribe({
      next: (list) => {
        this.notificaciones = list.filter(
          (n) => n.receiver_id === currentUser.id && n.is_read === 0
        );
        this.actualizarFlagsDesdeNotifications();
      },
      error: (err) => {
        console.error('Error cargando notificaciones', err);
        this.notificaciones = [];
        this.resetFlags();
      },
    });
  }

  onNotificationClick(noti: NotificationDto): void {
    const token = this.authService.gettoken() || '';
    if (!token) return;

    this.notificationsService.delete(noti.id, token).subscribe({
      next: () => {
        this.notificaciones = this.notificaciones.filter((n) => n.id !== noti.id);
        this.actualizarFlagsDesdeNotifications();

        if (noti.type === 'trip') {
          this.router.navigate(['/gestion-viajes']);
        } else if (noti.type === 'message') {
          this.router.navigate(['/gestion-viajes']);
        } else if (noti.type === 'favorites') {
          this.router.navigate(['/dashboard/favoritos']);
        } else if (noti.type === 'group') {
          this.router.navigate(['/gestion-viajes']);
        }
      },
      error: (err) => {
        console.error('Error eliminando notificación', err);
      },
    });
  }

  onSectionOpen(section: keyof typeof this.notif): void {
    const token = this.authService.gettoken() || '';
    if (!token) {
      this.notif[section] = false;
      this.hasNotifications = Object.values(this.notif).some((v) => v);
      return;
    }

    if (section === 'gestionViajes' && this.notificaciones.length > 0) {
      const toDelete = this.notificaciones.filter(
        (n) => n.type === 'trip' || n.type === 'message' || n.type === 'group'
      );
      if (toDelete.length === 0) {
        this.notif[section] = false;
        this.hasNotifications = Object.values(this.notif).some((v) => v);
        return;
      }

      toDelete.forEach((n) => {
        this.notificationsService.delete(n.id, token).subscribe({
          next: () => {
            this.notificaciones = this.notificaciones.filter((x) => x.id !== n.id);
            this.actualizarFlagsDesdeNotifications();
          },
          error: (err) => console.error('Error eliminando notificación de gestión de viajes', err),
        });
      });
    } else {
      if (this.notif[section]) {
        this.notif[section] = false;
        this.hasNotifications = Object.values(this.notif).some((v) => v);
      }
    }
  }

  onLogout(): void {
    this.authService.logout();

    this.router.navigate(['/login']);
  }
}
