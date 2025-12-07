import { Component, Injectable, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { Iuser } from '../../interfaces/iuser';

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
export class Registro implements OnInit {
  submitted = false;
  userForm: FormGroup;

  @Input() tituloFormulario: string = 'Regístrate y empieza tu aventura';
  @Input() textoBoton: string = 'Aceptar y registrarme';

  // Nuevo: modo edición + datos iniciales
  @Input() isEditMode: boolean = false;
  @Input() userData: Partial<Iuser> | null = null;

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

  ngOnInit(): void {
    if (this.isEditMode && this.userData) {
      // Rellenar campos con los datos del usuario
      this.userForm.patchValue({
        username: this.userData.username,
        email: this.userData.email,
        image: this.userData.image,
        telefono: this.userData.phone,
        descripcion: this.userData.bio,
        intereses: this.userData.interests,
      });

      // En edición, puedes hacer que password no sea obligatoria
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
      this.userForm.get('repeatPassword')?.clearValidators();
      this.userForm.get('repeatPassword')?.updateValueAndValidity();

      // Textos personalizados
      this.tituloFormulario = this.tituloFormulario || 'Actualiza tus datos';
      this.textoBoton = this.textoBoton || 'Guardar cambios';
    }
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

    // REGISTRO (modo creación)
    if (!this.isEditMode) {
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
    } else {
      // EDICIÓN (actualizar datos)
      try {
        const current = this.authService.getCurrentUser();
        if (!current) {
          toast.error('No hay usuario en sesión.');
          return;
        }

        await this.authService.updateUser(current.id, {
          username,
          email,
          image,
          phone: telefono,
          bio: descripcion,
          interests: intereses,
          // Si quieres permitir cambiar password aquí, la añades:
          ...(password ? { password } : {}),
        });

        toast.success('Datos actualizados correctamente.');
        // Opcional: navegar o solo mostrar mensaje
      } catch (err) {
        toast.error('No se pudieron actualizar los datos.');
      }
    }
  }
}

export function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const rep = group.get('repeatPassword')?.value;
  return pass && rep && pass !== rep ? { passwordsMismatch: true } : null;
}
