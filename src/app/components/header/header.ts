import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-header',
  imports: [RouterLink, Navbar],
  templateUrl: './header.html',
  styles: ``,
})
export class Header {}
