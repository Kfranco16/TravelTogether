import { Component, Injectable, Input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { Router } from '@angular/router';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
@Injectable({
  providedIn: 'root',
})
export class Registro {
  submitted = false;
  userForm: FormGroup;

  @Input() tituloFormulario: string = 'Regístrate y empieza tu aventura';
  @Input() textoBoton: string = 'Aceptar y registrarme';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
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

  async onSubmit(): Promise<void> {
    this.submitted = true;
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const { username, email, password, image, telefono, descripcion, intereses } =
      this.userForm.value;

    try {
      await this.authService.register({
        username,
        email,
        password,
        image,
        phone: telefono,
        bio: descripcion,
        interests: intereses,
      });
      alert('Registrado correctamente');

      this.router.navigate(['/home']);
    } catch (err: any) {
      const backendMsg = err?.error?.message;
      if (
        backendMsg?.toLowerCase().includes('existe') ||
        backendMsg?.toLowerCase().includes('ya registrado')
      ) {
        toast.error(backendMsg);
      } else {
        toast.error('Error en el registro, revisa los datos.');
      }
    }
  }
}

export function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const rep = group.get('repeatPassword')?.value;
  return pass && rep && pass !== rep ? { passwordsMismatch: true } : null;
}
