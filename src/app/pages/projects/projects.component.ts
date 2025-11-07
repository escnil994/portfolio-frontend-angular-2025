// projects.component.ts - VERSIÓN COMPLETA MEJORADA

import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { ProjectUI } from '../../interfaces/portfolio.interface';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './projects.component.html'
})
export class ProjectsComponent implements OnInit, OnDestroy {
  private readonly projectService = inject(ProjectService);
  private readonly destroy$ = new Subject<void>();

  readonly selectedCategory = signal('all');
  readonly projects = signal<ProjectUI[]>([]);
  readonly loading = signal(true);
  readonly viewMode = signal<'grid' | 'list'>('grid');

  readonly categories = ['all', 'web', 'devops', 'cloud'];

  ngOnInit() {
    this.loadProjects();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProjects() {
    this.loading.set(true);

    this.projectService.getProjects(0, 100).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.loading.set(false);
      }
    });
  }

  filterByCategory(category: string) {
    this.selectedCategory.set(category);
  }

  toggleViewMode() {
    this.viewMode.set(this.viewMode() === 'grid' ? 'list' : 'grid');
  }

  get filteredProjects(): ProjectUI[] {
    const category = this.selectedCategory();
    const allProjects = this.projects();

    if (category === 'all') {
      return allProjects;
    }

    return allProjects.filter(project => project.category === category);
  }

  get featuredProjects(): ProjectUI[] {
    return this.projects().filter(p => p.featured);
  }

  get categoryCount(): Record<string, number> {
    const allProjects = this.projects();
    return {
      all: allProjects.length,
      web: allProjects.filter(p => p.category === 'web').length,
      devops: allProjects.filter(p => p.category === 'devops').length,
      cloud: allProjects.filter(p => p.category === 'cloud').length
    };
  }
}
