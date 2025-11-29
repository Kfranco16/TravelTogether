import { Component, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { toast } from 'ngx-sonner';

interface LoginResponse {
  user: any;
  token: string;
}

@Component({
  selector: 'app-minilogin',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './minilogin.html',
  styles: ``,
})
export class Minilogin {
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
      const response: LoginResponse = await this.authService.login({ email, password });

      if (response && response.user) {
        // Actualiza el usuario en el BehaviorSubject
        this.authService.setCurrentUser(response.user);

        localStorage.setItem('token', response.token);

        toast.success('¡Usuario logueado correctamente!');
        this.router.navigate(['/home']);
      }
    } catch (err: any) {
      toast.error(err?.error?.message || 'Error en el inicio de sesión');
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
