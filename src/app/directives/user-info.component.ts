import { Component, output, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-info-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="close()">
        <div class="bg-base-100 rounded-lg p-6 max-w-md w-full" (click)="$event.stopPropagation()">
          <h3 class="text-xl font-bold mb-4">Before you react...</h3>
          <p class="text-base-content/70 mb-4">Please share your name and email</p>

          @if (error) {
            <div role="alert" class="alert alert-error text-sm p-3 mb-4">
              <span class="material-icons text-base">error_outline</span>
              <span>{{ error }}</span>
            </div>
          }
          <form (ngSubmit)="submit()" class="space-y-4">
            <div>
              <input
                type="text"
                [(ngModel)]="name"
                name="name"
                placeholder="Your name"
                required
                class="input input-bordered w-full">
            </div>

            <div>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                placeholder="Your email"
                required
                class="input input-bordered w-full">
            </div>

            <p class="text-xs text-base-content/60">
              Your email won't be published or shared
            </p>

            <div class="flex gap-3 justify-end">
              <button
                type="button"
                (click)="close()"
                class="btn btn-ghost">
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="!isValid()"
                class="btn btn-primary">
                Continue
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class UserInfoModalComponent {
  @Input() error: string | null = null;

  isOpen = signal(false);
  name = '';
  email = '';
  onSubmit = output<{ name: string; email: string }>();

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.name = '';
    this.email = '';
  }

  isValid(): boolean {
    return !!(this.name.trim() && this.email.trim() && this.email.includes('@'));
  }

  submit(): void {
    if (this.isValid()) {
      this.onSubmit.emit({ name: this.name, email: this.email });
      this.close();
    }
  }
}
