import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../../../services/project.service';
import { ProjectUI } from '../../../../interfaces/portfolio.interface';
import { AdminService } from '../../../../services/admin.service';

@Component({
  selector: 'app-admin-project-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-project-list.html',
})
export class AdminProjectListComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly adminService = inject(AdminService);

  readonly projects = signal<ProjectUI[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.loadProjects();
  }

  private loadProjects(): void {
    this.loading.set(true);
    this.projectService.getProjects(0, 100).subscribe({
      next: (projects) => {
        console.log(projects);

        this.projects.set(projects);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.loading.set(false);
      }
    });
  }

  deleteProject(project: ProjectUI): void {
    if (!confirm(`Are you sure you want to delete "${project.title}"?`)) {
      return;
    }

    this.adminService.deleteProject(project.id).subscribe({
      next: () => {
        this.projects.set(this.projects().filter(p => p.id !== project.id));
      },
      error: (error) => {
        console.error('Error deleting project:', error);
        alert('Failed to delete project');
      }
    });
  }
}
