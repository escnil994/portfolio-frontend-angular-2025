// unsubscribe.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SubscriptionService } from '../../services/subscription.service';

@Component({
  selector: 'app-unsubscribe',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <div class="card bg-base-100 shadow-xl max-w-md w-full">
        <div class="card-body">
          @if (!isUnsubscribed()) {
            <h2 class="card-title justify-center">Unsubscribe</h2>
            <p class="text-center text-base-content/70 mb-4">
              Sorry to see you go! Enter your email to unsubscribe.
            </p>

            <form (ngSubmit)="onUnsubscribe()" class="space-y-4">
              <div class="form-control">
                <input
                  type="email"
                  [formControl]="emailControl"
                  class="input input-bordered w-full"
                  placeholder="your@email.com"
                  [disabled]="isLoading()"
                >
              </div>

              @if (errorMessage()) {
                <div role="alert" class="alert alert-error">
                  <span class="material-icons">error_outline</span>
                  <span>{{ errorMessage() }}</span>
                </div>
              }

              <div class="card-actions justify-center">
                <button
                  type="submit"
                  [disabled]="isLoading() || emailControl.invalid"
                  class="btn btn-error gap-2"
                >
                  @if (isLoading()) {
                    <span class="loading loading-spinner loading-sm"></span>
                    <span>Unsubscribing...</span>
                  } @else {
                    <span class="material-icons">unsubscribe</span>
                    <span>Unsubscribe</span>
                  }
                </button>
              </div>
            </form>
          } @else {
            <div class="text-center">
              <span class="material-icons text-6xl text-success mx-auto block">check_circle</span>
              <h2 class="card-title justify-center mt-4">Unsubscribed</h2>
              <p class="text-base-content/70 mt-2">
                You've been successfully unsubscribed. You won't receive any more emails from us.
              </p>
              <div class="card-actions justify-center mt-6">
                <a routerLink="/blog" class="btn btn-primary gap-2">
                  <span class="material-icons">arrow_back</span>
                  Back to Blog
                </a>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class UnsubscribeComponent {
  private subscriptionService = inject(SubscriptionService);

  emailControl = new FormControl('', [Validators.required, Validators.email]);
  isLoading = signal(false);
  isUnsubscribed = signal(false);
  errorMessage = signal<string | null>(null);

  onUnsubscribe(): void {
    if (this.emailControl.invalid) {
      this.errorMessage.set('Please enter a valid email address');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const email = this.emailControl.value!;

    this.subscriptionService.unsubscribe(email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isUnsubscribed.set(true);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          error.error?.detail || 'Failed to unsubscribe. Please try again.'
        );
      }
    });
  }
}
