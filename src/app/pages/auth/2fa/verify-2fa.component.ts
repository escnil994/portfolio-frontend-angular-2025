import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-verify-2fa',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './verify-2fa.component.html'
})
export class Verify2faComponent implements OnInit {
  private fb = inject(FormBuilder);
  authService = inject(AuthService);
  private router = inject(Router);

  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  resendTimer = signal<number>(0);

  verifyForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
  });

  ngOnInit(): void {
    const tempToken = this.authService.tempToken();
    if (!tempToken) {
      this.router.navigate(['/login']);
    }
  }

  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/\D/g, '').slice(0, 6);
    this.verifyForm.patchValue({ code: cleaned });

    // Auto-submit when 6 digits entered
    if (cleaned.length === 6) {
      setTimeout(() => {
        if (this.verifyForm.valid) {
          this.onSubmit();
        }
      }, 300);
    }
  }

  onSubmit(): void {
    if (this.verifyForm.valid) {
      const tempToken = this.authService.tempToken();

      if (!tempToken) {
        this.errorMessage.set('Session expired. Please login again.');
        setTimeout(() => this.router.navigate(['/login']), 2000);
        return;
      }

      this.errorMessage.set('');
      this.successMessage.set('');

      this.authService.verify2FA({
        temp_token: tempToken,
        code: this.verifyForm.getRawValue().code
      }).subscribe({
        error: (error) => {
          this.errorMessage.set(error.error?.detail || 'Invalid verification code. Please try again.');
          this.verifyForm.patchValue({ code: '' });
        }
      });
    }
  }

  resendCode(): void {
    this.successMessage.set('New code sent to your email!');
    this.resendTimer.set(60);

    const interval = setInterval(() => {
      const current = this.resendTimer();
      if (current > 0) {
        this.resendTimer.set(current - 1);
      } else {
        clearInterval(interval);
      }
    }, 1000);
  }
}
