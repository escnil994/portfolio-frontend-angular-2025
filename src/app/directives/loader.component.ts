import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (type === 'spinner') {
      <div class="loader-spinner">
        <div class="spinner"></div>
        @if (message) {
          <p class="loader-message">{{ message }}</p>
        }
      </div>
    } @else if (type === 'skeleton-hero') {
      <div class="skeleton-hero">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-subtitle"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton-buttons">
          <div class="skeleton skeleton-button"></div>
          <div class="skeleton skeleton-button"></div>
        </div>
      </div>
    } @else if (type === 'skeleton-skills') {
      <div class="skeleton-skills-grid">
        @for (item of [1,2,3,4,5,6,7,8]; track item) {
          <div class="skeleton-skill-card">
            <div class="skeleton skeleton-icon"></div>
            <div class="skeleton skeleton-skill-name"></div>
          </div>
        }
      </div>
    } @else if (type === 'skeleton-project') {
      <div class="skeleton-project-card">
        <div class="skeleton skeleton-project-image"></div>
        <div class="skeleton-project-content">
          <div class="skeleton skeleton-project-title"></div>
          <div class="skeleton skeleton-project-text"></div>
          <div class="skeleton skeleton-project-text"></div>
          <div class="skeleton-project-tags">
            <div class="skeleton skeleton-tag"></div>
            <div class="skeleton skeleton-tag"></div>
            <div class="skeleton skeleton-tag"></div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* Spinner Loader */
    .loader-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 1rem;
    }

    .spinner {
      width: 64px;
      height: 64px;
      border: 4px solid transparent;
      border-top-color: hsl(var(--p));
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loader-message {
      color: hsl(var(--bc) / 0.7);
      font-size: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Skeleton Base */
    .skeleton {
      background: linear-gradient(
        90deg,
        hsl(var(--b2)) 0%,
        hsl(var(--b3)) 50%,
        hsl(var(--b2)) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 0.5rem;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* Skeleton Hero */
    .skeleton-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      padding: 4rem 1rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .skeleton-title {
      width: 400px;
      max-width: 90%;
      height: 60px;
    }

    .skeleton-subtitle {
      width: 300px;
      max-width: 80%;
      height: 40px;
    }

    .skeleton-text {
      width: 600px;
      max-width: 95%;
      height: 24px;
    }

    .skeleton-buttons {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    .skeleton-button {
      width: 150px;
      height: 48px;
    }

    /* Skeleton Skills Grid */
    .skeleton-skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1.5rem;
      padding: 2rem;
    }

    .skeleton-skill-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem 1rem;
      background: hsl(var(--b1));
      border-radius: 1rem;
    }

    .skeleton-icon {
      width: 80px;
      height: 80px;
      border-radius: 1rem;
    }

    .skeleton-skill-name {
      width: 100px;
      height: 24px;
    }

    /* Skeleton Project Card */
    .skeleton-project-card {
      background: hsl(var(--b1));
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }

    .skeleton-project-image {
      width: 100%;
      height: 200px;
    }

    .skeleton-project-content {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .skeleton-project-title {
      width: 80%;
      height: 32px;
    }

    .skeleton-project-text {
      width: 100%;
      height: 20px;
    }

    .skeleton-project-tags {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .skeleton-tag {
      width: 60px;
      height: 24px;
      border-radius: 9999px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .skeleton-title {
        width: 300px;
        height: 48px;
      }

      .skeleton-subtitle {
        width: 200px;
        height: 32px;
      }

      .skeleton-buttons {
        flex-direction: column;
        width: 100%;
      }

      .skeleton-button {
        width: 100%;
      }
    }
  `]
})
export class LoaderComponent {
  @Input() type: 'spinner' | 'skeleton-hero' | 'skeleton-skills' | 'skeleton-project' = 'spinner';
  @Input() message: string = 'Loading...';
}
