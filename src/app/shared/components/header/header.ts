import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { Logo } from '../logo/logo';

@Component({
  selector: 'app-header',
  imports: [RouterLink, Navbar, Logo],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class Header {}
