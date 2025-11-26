import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

type VerificationMethod = 'email' | 'totp' | 'backup';

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

  availableMethods = this.authService.available2faMethods;
  selectedMethod = signal<VerificationMethod>('email');

  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  resendTimer = signal<number>(0);
  emailSent = signal<boolean>(false);

  verifyForm = this.fb.nonNullable.group({
    code: ['', [Validators.required]]
  });

  ngOnInit(): void {
    const tempToken = this.authService.tempToken();
    if (!tempToken) {
      this.router.navigate(['/private/user/me/login']);
      return;
    }

    const methods = this.availableMethods();
    if (methods.includes('totp')) {
      this.selectedMethod.set('totp');
    } else if (methods.includes('email')) {
      this.selectedMethod.set('email');
    } else if (methods.includes('backup')) {
      this.selectedMethod.set('backup');
    }
  }

  selectMethod(method: VerificationMethod): void {
    this.selectedMethod.set(method);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.verifyForm.reset();
  }

  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let cleaned = input.value;
    const method = this.selectedMethod();

    if (method === 'backup') {
      cleaned = cleaned.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 9);
    } else {
      cleaned = cleaned.replace(/\D/g, '').slice(0, 6);
      if (cleaned.length === 6 && this.verifyForm.valid) {
        setTimeout(() => this.onSubmit(), 100);
      }
    }
    this.verifyForm.patchValue({ code: cleaned }, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.verifyForm.invalid) return;

    const tempToken = this.authService.tempToken();
    if (!tempToken) {
      this.errorMessage.set('Session expired. Please login again.');
      setTimeout(() => this.router.navigate(['/private/user/me/login']), 2000);
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

  requestEmailCode(): void {
    const tempToken = this.authService.tempToken();
    if (!tempToken || this.resendTimer() > 0) return;

    this.authService.requestEmailCode(tempToken).subscribe({
      next: (res) => {
        this.successMessage.set(res.message || 'New code sent to your email!');
        this.emailSent.set(true);
        this.startResendTimer();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Failed to send email.');
      }
    });
  }

  startResendTimer(): void {
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
