import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AbstractControl, ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  submitted = false;
  userForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        repeatPassword: ['', [Validators.required]],
        image: ['', [Validators.pattern(/^https?:\/\/.+/i)]],
        telefono: ['', [Validators.pattern(/^\+?\d{7,15}$/)]],
        descripcion: [''],
        intereses: [''],
      },
      { validators: passwordsMatch }
    );
  }

  isInvalid(controlName: string): boolean {
    const c = this.userForm.get(controlName);
    return !!(c && c.invalid && (c.touched || this.submitted));
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    console.log('Formulario enviado', this.userForm.value);
  }
}

export function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const rep = group.get('repeatPassword')?.value;
  return pass && rep && pass !== rep ? { passwordsMismatch: true } : null;
}
