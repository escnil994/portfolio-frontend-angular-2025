import { Component, inject, signal, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../../services/theme.service';
import { AuthService } from '../../../services/auth.service';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  themeService = inject(ThemeService);
  authService = inject(AuthService);
  adminService = inject(AdminService);

  menuOpen = false;
  userMenuOpen = signal(false);
  profileImage = signal<string | null>(null);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu-wrapper')) {
      this.userMenuOpen.set(false);
    }
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.loadProfile();
    }
  }

  loadProfile(): void {
    this.adminService.getProfile().subscribe({
      next: (profile) => {
        if (profile.images && profile.images.length > 0) {
          this.profileImage.set(profile.images[0].image_url);
        }
      },
      error: () => {
        this.authService.logout();
      }
    });
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) {
      this.userMenuOpen.set(false);
    }
  }

  closeMenu() {
    this.menuOpen = false;
  }

  toggleUserMenu() {
    this.userMenuOpen.update((v) => !v);
    if (this.userMenuOpen()) {
      this.menuOpen = false;
    }
  }

  closeUserMenu() {
    this.userMenuOpen.set(false);
  }

  logout() {
    this.closeUserMenu();
    this.authService.logout();
  }

  getUserInitials(): string {
    const user = this.authService.currentUser();

    if (!user) return '';

    if (user.full_name) {
      const names = user.full_name.split(' ');
      return names.length > 1
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0].substring(0, 2).toUpperCase();
    }

    return user.username ? user.username.substring(0, 2).toUpperCase() : 'US';
  }
}
