import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

localStorage.setItem('tt_token', 'fakeToken123');
localStorage.setItem(
  'tt_user',
  JSON.stringify({
    id: 1,
    username: 'leany',
    email: 'leany@example.com',
    role: 'user',
  })
);
location.reload();
