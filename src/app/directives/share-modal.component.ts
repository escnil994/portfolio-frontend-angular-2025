import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ShareOption {
  name: string;
  icon: string;
  color: string;
  action: (url: string, title: string) => void;
}

@Component({
  selector: 'app-share-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
    <div class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Share this post</h3>

        <!-- Share URL Input -->
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Post URL</span>
          </label>
          <div class="join w-full">
            <input
              type="text"
              [value]="shareUrl()"
              readonly
              class="input input-bordered join-item flex-1"
              #urlInput
            />
            <button class="btn join-item btn-primary" (click)="copyToClipboard(urlInput.value)">
              <span class="material-icons">content_copy</span>
              {{ copied() ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

        <!-- Social Share Buttons -->
        <div class="grid grid-cols-2 gap-3 mb-4">
          @for (option of shareOptions; track option.name) {
          <button
            (click)="option.action(shareUrl(), shareTitle())"
            [class]="'btn btn-outline gap-2 ' + option.color"
          >
            <span class="material-icons">{{ option.icon }}</span>
            {{ option.name }}
          </button>
          }
        </div>

        <!-- Close Button -->
        <div class="modal-action">
          <button class="btn" (click)="onClose.emit()">Close</button>
        </div>
      </div>
      <div class="modal-backdrop" (click)="onClose.emit()"></div>
    </div>
    }
  `,
  styles: [
    `
      .modal-backdrop {
        background-color: rgba(0, 0, 0, 0.5);
      }
    `,
  ],
})
export class ShareModalComponent {
  isOpen = input.required<boolean>();
  shareUrl = input.required<string>();
  shareTitle = input.required<string>();
  shareDescription = input<string>('');
  onClose = output<void>();

  copied = signal(false);

  shareOptions: ShareOption[] = [
  {
    name: 'Facebook',
    icon: 'facebook',
    color: 'text-[#1877F2]',
    action: (url: string, title: string) => {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        '_blank'  // Solo esto, sin width/height
      );
    }
  },
  {
    name: 'Twitter',
    icon: 'share',
    color: 'text-[#1DA1F2]',
    action: (url: string, title: string) => {
      window.open(
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
        '_blank'
      );
    }
  },
  {
    name: 'LinkedIn',
    icon: 'work',
    color: 'text-[#0A66C2]',
    action: (url: string, title: string) => {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        '_blank'
      );
    }
  },
  {
    name: 'WhatsApp',
    icon: 'chat',
    color: 'text-[#25D366]',
    action: (url: string, title: string) => {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
        '_blank'
      );
    }
  },
  {
    name: 'Telegram',
    icon: 'send',
    color: 'text-[#0088cc]',
    action: (url: string, title: string) => {
      window.open(
        `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
        '_blank'
      );
    }
  },
  {
    name: 'Email',
    icon: 'email',
    color: 'text-base-content',
    action: (url: string, title: string) => {
      window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`;
    }
  }
];

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
