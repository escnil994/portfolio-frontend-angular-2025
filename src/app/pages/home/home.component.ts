import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ProjectService } from '../../services/project.service';
import { ProjectUI, Skill } from '../../interfaces/portfolio.interface';
import { AnimateOnScrollDirective } from '../../directives/animate-on-scroll.directive';
import { LoaderComponent } from '../../directives/loader.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, AnimateOnScrollDirective, LoaderComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  private apiService = inject(ApiService);
  private projectService = inject(ProjectService);

  profile = this.apiService.profile;
  profileLoading = this.apiService.loading;

  featuredProjects = signal<ProjectUI[]>([]);
  projectsLoading = signal<boolean>(true);
  scrollOpacity = signal<number>(1);

  displayName = computed(() => {
    const p = this.profile();
    if (!p) return '';
    return p.display_name || `${p.name} ${p.last_name || ''}`.trim();
  });

  skills = computed(() => {
    const p = this.profile();
    if (!p?.skills) return [];

    const raw = p.skills as any;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return (parsed.skills || parsed) as Skill[];
      } catch {
        return [];
      }
    }
    return (raw.skills || raw) as Skill[];
  });

  topSkills = computed(() => this.skills().slice(0, 16));

  @HostListener('window:scroll')
  onWindowScroll() {
    const scrollPosition = window.scrollY;
    const opacity = Math.max(0, 1 - scrollPosition / 200);
    this.scrollOpacity.set(opacity);
  }

  ngOnInit() {
    this.apiService.getProfile().subscribe();

    this.projectService.getProjects(0, 3, true).subscribe({
      next: (projects) => {
        this.featuredProjects.set(projects);
        this.projectsLoading.set(false);
      },
      error: () => this.projectsLoading.set(false)
    });
  }

  scrollToSkills() {
    document.getElementById('skills')?.scrollIntoView({ behavior: 'smooth' });
  }

  getSkillsByCategory(category: string): Skill[] {
    return this.skills().filter((skill) => skill.category === category);
  }

  getTopSkillsByProficiency(limit: number = 12): Skill[] {
    return [...this.skills()]
      .sort((a, b) => b.proficiency - a.proficiency)
      .slice(0, limit);
  }
}
