import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  authService = inject(AuthService);

  errorMessage = signal<string>('');

  loginForm = this.fb.nonNullable.group({
    identifier: ['', [Validators.required, Validators.minLength(6)]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.errorMessage.set('');

      this.authService.login(this.loginForm.getRawValue()).subscribe({
        error: (error) => {
          this.errorMessage.set(error.error?.detail || 'Login failed. Please try again.');
        }
      });
    }
  }
}
