import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import {
  ProfileResponse,
  ParsedSkill,
  ParsedExperience,
  ParsedEducation,
  ParsedCertification,
  ParsedAchievement
} from '../../interfaces/user.interface';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
  private apiService = inject(AdminService);

  profile = signal<ProfileResponse | null>(null);
  loading = signal(true);

  parsedSkills = signal<ParsedSkill[]>([]);
  parsedExperience = signal<ParsedExperience[]>([]);
  parsedEducation = signal<ParsedEducation[]>([]);
  parsedCertifications = signal<ParsedCertification[]>([]);
  parsedAchievements = signal<ParsedAchievement[]>([]);

  profileImage = computed(() => {
    const p = this.profile();
    if (p?.images && p.images.length > 0) {
      return p.images[0].image_url;
    }
    return '';
  });

  fullName = computed(() => {
    const p = this.profile();
    if (!p) return '';
    return p.display_name || `${p.name} ${p.last_name || ''}`.trim();
  });

  ngOnInit() {
    this.apiService.getProfile().subscribe({
      next: (data) => {
        this.profile.set(data as ProfileResponse);
        this.parseAllJsonFields(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load profile', err);
        this.loading.set(false);
      }
    });
  }

  private parseAllJsonFields(data: ProfileResponse) {
    if (data.skills) {
      try {
        const parsed = JSON.parse(data.skills);
        this.parsedSkills.set(parsed.skills || parsed);
      } catch (e) {
        console.error('Error parsing skills', e);
      }
    }

    if (data.experience) {
      try {
        const parsed = JSON.parse(data.experience);
        this.parsedExperience.set(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.error('Error parsing experience', e);
      }
    }

    if (data.education) {
      try {
        const parsed = JSON.parse(data.education);
        this.parsedEducation.set(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.error('Error parsing education', e);
      }
    }

    if (data.certifications) {
      try {
        const parsed = JSON.parse(data.certifications);
        this.parsedCertifications.set(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.error('Error parsing certifications', e);
      }
    }

    if (data.achievements) {
      try {
        const parsed = JSON.parse(data.achievements);
        this.parsedAchievements.set(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.error('Error parsing achievements', e);
      }
    }
  }

  getProfileImage(): string {
    return this.profileImage();
  }
}
