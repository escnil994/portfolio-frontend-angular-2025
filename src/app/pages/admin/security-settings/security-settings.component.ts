import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AuthService } from '../../../services/auth.service';
import { EnableTOTPResponse } from '../../../interfaces/auth.interface';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './security-settings.component.html',
})
export class SettingsComponent {
  authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);

  readonly currentUser = this.authService.currentUser;

  qrCodeDataUrl = signal<SafeUrl | null>(null);
  isVerifyingTOTP = signal<boolean>(false);
  totpSecret = signal<string>('');
  backupCodes = signal<string[]>([]);

  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  emailErrorMessage = signal<string>('');

  passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: this.mustMatch('newPassword', 'confirmPassword'),
    }
  );

  enableTotpForm = this.fb.nonNullable.group({
    password: ['', [Validators.required]],
  });

  totpForm = this.fb.nonNullable.group({
    code: [
      '',
      [Validators.required, Validators.minLength(6), Validators.maxLength(6)],
    ],
  });

  disableTotpForm = this.fb.nonNullable.group({
    password: ['', [Validators.required]],
  });

  private mustMatch(controlName: string, matchingControlName: string): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const control = formGroup.get(controlName);
      const matchingControl = formGroup.get(matchingControlName);
      if (!control || !matchingControl) return null;
      if (matchingControl.errors && !matchingControl.errors['mustMatch']) return null;
      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }
      return null;
    };
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.emailErrorMessage.set('');
  }

  onToggleEmail2FA(event: Event): void {
    this.clearMessages();
    const checkbox = event.target as HTMLInputElement;
    const isEnabled = checkbox.checked;
    const user = this.currentUser();
    if (!user) return;

    const password = prompt(
      `Please enter your password to ${isEnabled ? 'enable' : 'disable'} Email 2FA:`
    );

    if (!password) {
      checkbox.checked = !isEnabled;
      return;
    }

    const request = { password };
    const operation = isEnabled
      ? this.authService.enableEmail2FA(request)
      : this.authService.disableEmail2FA(request);

    operation.subscribe({
      next: () => {
        this.successMessage.set(
          `Email 2FA ${isEnabled ? 'enabled' : 'disabled'} successfully.`
        );
        this.authService.getCurrentUser().subscribe();
      },
      error: (err) => {
        this.emailErrorMessage.set(
          err.error?.detail || 'Error changing Email 2FA status.'
        );
        checkbox.checked = !isEnabled;
      },
    });
  }

  onEnableTOTP(): void {
    if (this.enableTotpForm.invalid) return;
    this.clearMessages();
    const { password } = this.enableTotpForm.getRawValue();

    this.authService.enableTOTP({ password }).subscribe({
      next: (response: EnableTOTPResponse) => {
        const safeQr = this.sanitizer.bypassSecurityTrustUrl(response.qr_code);
        this.qrCodeDataUrl.set(safeQr);
        this.totpSecret.set(response.secret);
        this.backupCodes.set(response.backup_codes);
        this.isVerifyingTOTP.set(true);
        this.enableTotpForm.reset();
      },
      error: (err) =>
        this.errorMessage.set(
          err.error?.detail || 'Incorrect password or failed to init 2FA.'
        ),
    });
  }

  onVerifyTOTP(): void {
    if (this.totpForm.invalid) return;
    this.clearMessages();
    const { code } = this.totpForm.getRawValue();
    this.authService.verifyTOTP({ code }).subscribe({
      next: () => {
        this.successMessage.set('Authenticator App 2FA enabled successfully!');
        this.isVerifyingTOTP.set(false);
        this.qrCodeDataUrl.set(null);
        this.totpSecret.set('');
        this.backupCodes.set([]);
        this.totpForm.reset();
        this.authService.getCurrentUser().subscribe();
      },
      error: (err) =>
        this.errorMessage.set(
          err.error?.detail || 'Invalid code. Please try again.'
        ),
    });
  }

  onDisableTOTP(): void {
    if (this.disableTotpForm.invalid) return;
    this.clearMessages();
    const { password } = this.disableTotpForm.getRawValue();
    this.authService.disableTOTP({ password }).subscribe({
      next: () => {
        this.successMessage.set('Authenticator App 2FA disabled successfully.');
        this.disableTotpForm.reset();
        this.authService.getCurrentUser().subscribe();
      },
      error: (err) =>
        this.errorMessage.set(
          err.error?.detail || 'Incorrect password or failed to disable.'
        ),
    });
  }

  onCancelVerify(): void {
    this.isVerifyingTOTP.set(false);
    this.qrCodeDataUrl.set(null);
    this.totpSecret.set('');
    this.backupCodes.set([]);
    this.totpForm.reset();
    this.clearMessages();
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) return;
    this.clearMessages();
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.authService
      .changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })
      .subscribe({
        next: () => {
          this.successMessage.set('Password updated successfully.');
          this.passwordForm.reset();
        },
        error: (err) =>
          this.errorMessage.set(
            err.error?.detail || 'Error changing password.'
          ),
      });
  }
}
