import { Component, input, signal, OnInit, OnDestroy, output, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-image-carousel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative h-80 overflow-hidden rounded-lg cursor-pointer" (click)="onImageClick.emit(currentIndex())">
      @for (image of images(); track $index) {
        <img
          [src]="image"
          [alt]="'Image ' + ($index + 1)"
          [class.opacity-0]="currentIndex() !== $index"
          [class.opacity-100]="currentIndex() === $index"
          class="absolute inset-0 w-full h-full object-cover transition-opacity duration-500">
      }

      @if (images().length > 1) {
        <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          @for (image of images(); track $index) {
            <div
              (click)="setIndex($index); $event.stopPropagation()"
              [class.bg-primary]="currentIndex() === $index"
              [class.bg-base-100]="currentIndex() !== $index"
              [class.opacity-50]="currentIndex() !== $index"
              class="w-2 h-2 rounded-full cursor-pointer transition-all duration-300">
            </div>
          }
        </div>

        <button
          (click)="previousImage(); $event.stopPropagation()"
          class="absolute left-4 top-1/2 transform -translate-y-1/2 btn btn-circle btn-sm bg-base-100/80 hover:bg-base-100 border-none z-10">
          <span class="material-icons">chevron_left</span>
        </button>

        <button
          (click)="nextImage(); $event.stopPropagation()"
          class="absolute right-4 top-1/2 transform -translate-y-1/2 btn btn-circle btn-sm bg-base-100/80 hover:bg-base-100 border-none z-10">
          <span class="material-icons">chevron_right</span>
        </button>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ImageCarouselComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  images = input.required<string[]>();
  currentIndex = signal(0);
  onImageClick = output<number>();
  private intervalId?: number;

  ngOnInit(): void {
    if (this.isBrowser && this.images().length > 1) {
      this.startAutoplay();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  private startAutoplay(): void {
    if (!this.isBrowser) return;
    this.intervalId = window.setInterval(() => {
      this.nextImage();
    }, 3000);
  }

  private stopAutoplay(): void {
    if (this.isBrowser && this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  nextImage(): void {
    const next = (this.currentIndex() + 1) % this.images().length;
    this.currentIndex.set(next);
  }

  previousImage(): void {
    const prev = (this.currentIndex() - 1 + this.images().length) % this.images().length;
    this.currentIndex.set(prev);
  }

  setIndex(index: number): void {
    this.currentIndex.set(index);
    this.stopAutoplay();
    this.startAutoplay();
  }
}
