import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="onClose.emit()">
        <button
          (click)="onClose.emit()"
          class="absolute top-4 right-4 btn btn-circle bg-base-100/20 hover:bg-base-100/30 border-none text-white">
          <span class="material-icons text-3xl">close</span>
        </button>

        <div class="relative max-w-7xl max-h-full" (click)="$event.stopPropagation()">
          <img
            [src]="images()[currentIndex()]"
            [alt]="'Image ' + (currentIndex() + 1)"
            class="max-h-[90vh] max-w-full object-contain rounded-lg">

          @if (images().length > 1) {
            <button
              (click)="previousImage()"
              class="absolute left-4 top-1/2 transform -translate-y-1/2 btn btn-circle btn-lg bg-base-100/20 hover:bg-base-100/30 border-none text-white">
              <span class="material-icons text-2xl">chevron_left</span>
            </button>

            <button
              (click)="nextImage()"
              class="absolute right-4 top-1/2 transform -translate-y-1/2 btn btn-circle btn-lg bg-base-100/20 hover:bg-base-100/30 border-none text-white">
              <span class="material-icons text-2xl">chevron_right</span>
            </button>

            <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-base-100/20 backdrop-blur-md text-white px-4 py-2 rounded-full">
              {{ currentIndex() + 1 }} / {{ images().length }}
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class ImageModalComponent {
  images = input.required<string[]>();
  initialIndex = input<number>(0);
  isOpen = input.required<boolean>();
  onClose = output<void>();
  currentIndex = signal(0);

  ngOnChanges(): void {
    if (this.isOpen()) {
      this.currentIndex.set(this.initialIndex());
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
}
