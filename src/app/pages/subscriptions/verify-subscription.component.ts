import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SubscriptionService } from '../../services/subscription.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-verify-subscription',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <div class="card bg-base-100 shadow-xl max-w-md w-full">
        <div class="card-body text-center">

          @if (isVerifying()) {
            <span class="loading loading-spinner loading-lg text-primary mx-auto"></span>
            <h2 class="card-title justify-center mt-4">Verifying...</h2>
            <p class="text-base-content/70">Please wait while we verify your subscription.</p>

          } @else if (isSuccess()) {
            <span class="material-icons text-6xl text-success mx-auto">check_circle</span>
            <h2 class="card-title justify-center mt-4">Success!</h2>
            <p class="text-base-content/70">{{ message() }}</p>
            <div class="card-actions justify-center mt-4">
              <a routerLink="/blog" class="btn btn-primary gap-2">
                <span class="material-icons">arrow_back</span>
                Go to Blog
              </a>
            </div>

          } @else if (isError()) {
            <span class="material-icons text-6xl text-error mx-auto">error_outline</span>
            <h2 class="card-title justify-center mt-4">Verification Failed</h2>
            <p class="text-base-content/70">{{ message() }}</p>
            <div class="card-actions justify-center mt-4">
              <a routerLink="/blog" class="btn btn-outline gap-2">
                <span class="material-icons">arrow_back</span>
                Back to Blog
              </a>
            </div>
          }

        </div>
      </div>
    </div>
  `
})
export class VerifySubscriptionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private subscriptionService = inject(SubscriptionService);

  isVerifying = signal(true);
  isSuccess = signal(false);
  isError = signal(false);
  message = signal('');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.isVerifying.set(false);
      this.isError.set(true);
      this.message.set('No verification token found. The link may be incomplete or incorrect.');
      return;
    }

    this.subscriptionService.verify(token).subscribe({
      next: (response) => {
        console.log(response);

        this.isVerifying.set(false);
        this.isSuccess.set(true);
        this.message.set(response.message);
      },
      error: (error: HttpErrorResponse) => {
        console.error("Verification error:", error);

        this.isVerifying.set(false);
        this.isError.set(true);

        let specificMessage = 'An unexpected error occurred. Please try again later.';

        if (error.error?.detail) {
          specificMessage = error.error.detail;
        } else if (error.status === 0) {
          specificMessage = 'Could not connect to the server. Please check your internet connection.';
        } else if (error.status === 404 || error.status === 400) {
          specificMessage = 'The verification link appears to be invalid or has expired.';
        } else if (error.status >= 500) {
          specificMessage = 'We had a problem on our server. Please try again in a few moments.';
        }

        this.message.set(specificMessage);
      }
    });
  }
}
