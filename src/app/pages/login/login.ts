import { Component, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';
@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login.html',
  styles: ``,
})
export class Login {
  authService = inject(AuthService);
  private formBuilder = inject(FormBuilder);

  private router = inject(Router);

  formSubmitAttempt = false;

  loginForm: FormGroup = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(5)]],
    /* rememberMe: [false], */
  });

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.formSubmitAttempt));
  }

  // getErrorMessage(fieldName: string): string {
  //   const field = this.loginForm.get(fieldName);

  //   if (field?.hasError('required')) {
  //     return fieldName === 'email' ? 'Introduce un correo válido.' : 'Introduce tu contraseña.';
  //   }

  //   if (field?.hasError('email')) {
  //     return 'El formato del correo no es válido.';
  //   }

  //   if (field?.hasError('minlength')) {
  //     return 'La contraseña debe tener al menos 6 caracteres.';
  //   }

  //   return '';
  // }

  onSubmit(): void {
    this.formSubmitAttempt = true;

    if (this.loginForm.valid) {
      const { email, password /* , rememberMe  */ } = this.loginForm.value;

      this.login(email, password /* , rememberMe */);
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  private async login(email: string, password: string) {
    try {
      const response = await this.authService.login({ email, password });
      if (response) {
        localStorage.setItem('token', response.token);
        this.router.navigate(['/dashboard']);
      }
    } catch (msg: any) {
      alert(msg.error.message || 'Error en el inicio de sesión');
    }
    // Futura llamada a la API para el login
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  resetForm(): void {
    this.loginForm.reset();
    this.formSubmitAttempt = false;
  }
}
