import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.html',
  standalone: true,
  styleUrls: ['./logo.css'],
})
export class Logo {
  @Input() showText: boolean = true;

  @Input() size: number = 40;

  onLogoClick(): void {
    window.location.href = '/home';
  }
}
