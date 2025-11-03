import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.html',
  styleUrls: ['./logo.css'],
})
export class Logo {
  @Input() showText: boolean = true;

  @Input() size: number = 40;
}
