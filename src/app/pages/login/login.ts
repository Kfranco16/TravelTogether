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
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.formSubmitAttempt));
  }

  onSubmit(): void {
    this.formSubmitAttempt = true;
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.login(email, password);
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  private async login(email: string, password: string) {
    try {
      // Usa el método login adaptado que guarda token y usuario
      const response = await this.authService.login({ email, password });
      if (response) {
        // Ya guarda token/usuario, solo navega al área privada
        this.router.navigate(['/dashboard']);
      }
    } catch (err: any) {
      alert(err?.error?.message || 'Error en el inicio de sesión');
    }
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
