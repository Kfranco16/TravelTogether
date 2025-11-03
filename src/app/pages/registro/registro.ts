import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  userForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        repeatPassword: ['', [Validators.required]],
        image: ['', [Validators.pattern(/^(https?:\/\/)[^\s]+$/)]],
        telefono: ['', [Validators.pattern(/^[\d\+\s()-]{6,}$/)]],
        descripcion: [''],
        intereses: [''],
      },
      { validators: passwordsMatchValidator() }
    );
  }

  submit() {
    if (this.userForm.valid) {
      // Procesa el registro, enviar a API, etc.
      console.log(this.userForm.value);
    } else {
      this.userForm.markAllAsTouched();
    }
  }
}
function passwordsMatchValidator(): any {
  return (group: FormGroup) => {
    const passwordControl = group.get('password');
    const repeatControl = group.get('repeatPassword');
    if (!passwordControl || !repeatControl) return null;

    const password = passwordControl.value;
    const repeat = repeatControl.value;

    // If another validator has set an error on repeatPassword, don't clear it here
    if (repeatControl.errors && !repeatControl.errors['passwordMismatch']) {
      return null;
    }

    if (password !== repeat) {
      repeatControl.setErrors({ ...(repeatControl.errors || {}), passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      if (repeatControl.errors) {
        const { passwordMismatch, ...otherErrors } = repeatControl.errors;
        if (Object.keys(otherErrors).length) {
          repeatControl.setErrors(otherErrors);
        } else {
          repeatControl.setErrors(null);
        }
      }
      return null;
    }
  };
}
