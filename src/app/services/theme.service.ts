import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  isDark = signal(true);

  constructor() {
    if (this.isBrowser) {
      const saved = localStorage.getItem('theme');
      this.isDark.set(saved === 'dark' || saved === null);
      this.applyTheme();
    }
  }

  toggle() {
    this.isDark.update(v => !v);
    this.applyTheme();
  }

  private applyTheme() {
    if (!this.isBrowser) return;

    const theme = this.isDark() ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', this.isDark());
    localStorage.setItem('theme', theme);
  }
}
