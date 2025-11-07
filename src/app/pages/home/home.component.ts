import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Project, ProjectUI, Skill } from '../../interfaces/portfolio.interface';
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
  apiService = inject(ApiService);
  profile = this.apiService.profile;
  profileLoading = this.apiService.profileLoading;
  projectsLoading = this.apiService.projectsLoading;
  featuredProjects = signal<ProjectUI[]>([]);
  showScrollIndicator = signal(true);

  displayName = computed(() => {
    const profileData = this.profile();
    if (!profileData) return '';

    if (profileData.display_name) {
      return profileData.display_name;
    }

    return `${profileData.name} ${profileData.last_name || ''}`.trim();
  });

  skills = computed(() => {
    const profileData = this.profile();
    if (!profileData?.skills) {
      return [];
    }

    let skillsData = profileData.skills;
    if (typeof skillsData === 'string') {
      try {
        skillsData = JSON.parse(skillsData);
      } catch (e) {
        console.error('Error parsing skills:', e);
        return [];
      }
    }

    if (skillsData && typeof skillsData === 'object' && 'skills' in skillsData) {
      return skillsData.skills || [];
    }

    return [];
  });

  topSkills = computed(() => {
    return this.skills().slice(0, 16);
  });

  @HostListener('window:scroll')
  onWindowScroll() {
    const scrollPosition = window.scrollY;
    const opacity = Math.max(0, 1 - scrollPosition / 200);

    const indicator = document.querySelector('.scroll-indicator') as HTMLElement;
    if (indicator) {
      indicator.style.opacity = opacity.toString();
      indicator.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';
    }
  }

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.apiService.getProfile().subscribe();

    this.apiService.getProjects(0, 2, true).subscribe({
      next: (backendProjects: Project[]) => {
        const mappedProjects = backendProjects.map(proj => this.mapBackendProject(proj));
        this.featuredProjects.set(mappedProjects);
      },
      error: (error) => {
        console.error('Error loading featured projects:', error);
      }
    });
  }

  private mapBackendProject(backendProj: Project): ProjectUI {
    const imageUrls = backendProj.images
      .sort((a, b) => a.image_order - b.image_order)
      .map(img => img.image_url);

    return {
      id: backendProj.id,
      title: backendProj.title,
      description: backendProj.description,
      image: imageUrls.length > 0
        ? imageUrls[0]
        : 'https://via.placeholder.com/800x600?text=No+Image',
      images: imageUrls.length > 0
        ? imageUrls
        : ['https://via.placeholder.com/800x600?text=No+Image'],
      featured: backendProj.featured,
      technologies: backendProj.technologies
        ? backendProj.technologies.split(',').map(t => t.trim())
        : [],
      githubUrl: backendProj.github_url || undefined,
      demoUrl: backendProj.demo_url || undefined
    };
  }

  scrollToSkills() {
    document.getElementById('skills')?.scrollIntoView({ behavior: 'smooth' });
  }

  getSkillsByCategory(category: string): Skill[] {
    return this.skills().filter((skill) => skill.category === category);
  }

  getTopSkillsByProficiency(limit: number = 12): Skill[] {
    return [...this.skills()].sort((a, b) => b.proficiency - a.proficiency).slice(0, limit);
  }
}
