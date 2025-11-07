// project.service.ts - NUEVO ARCHIVO

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Project,
  ProjectWithDetails,
  ProjectUI,
  Comment,
  CommentCreate,
  ReactionSummary,
  Image
} from '../interfaces/portfolio.interface';
import { ReactionType } from '../enums/reaction-type.enum';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/projects`;

  // Get all projects
  getProjects(skip: number = 0, limit: number = 100, featured?: boolean): Observable<ProjectUI[]> {
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());

    if (featured !== undefined) {
      params = params.set('featured', featured.toString());
    }

    return this.http.get<Project[]>(this.apiUrl, { params }).pipe(
      map(projects => projects.map(proj => this.mapProjectToUI(proj)))
    );
  }

  // Get single project with details
  getProject(id: number): Observable<ProjectUI> {
    return this.http.get<ProjectWithDetails>(`${this.apiUrl}/${id}`).pipe(
      map(proj => this.mapProjectToUI(proj))
    );
  }

  // Comments
  addComment(projectId: number, comment: CommentCreate): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/${projectId}/comments`, comment);
  }

  getComments(projectId: number): Observable<Comment[]> {
    return this.http.get<ProjectWithDetails>(`${this.apiUrl}/${projectId}`).pipe(
      map(project => project.comments || [])
    );
  }

  // Reactions
  addReaction(
    projectId: number,
    reactionData: { email: string; name: string; reaction_type: ReactionType }
  ): Observable<any> {

    return this.http.post(
      `${environment.apiUrl}/reactions/project/${projectId}`,
      reactionData
    );
  }

  getReactions(projectId: number, userEmail?: string): Observable<ReactionSummary> {
    let params = new HttpParams();
    if (userEmail) {
      params = params.set('user_email', userEmail);
    }
    return this.http.get<ReactionSummary>(
      `${environment.apiUrl}/reactions/project/${projectId}/summary`,
      { params }
    );
  }

  deleteReaction(projectId: number, email: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/reactions/project/${projectId}`,
      { params: { email } }
    );
  }

  // Helper methods
  private mapProjectToUI(proj: Project | ProjectWithDetails): ProjectUI {
    const imageUrls = proj.images
      ?.sort((a, b) => a.image_order - b.image_order)
      .map(img => img.image_url) || [];

    const category = this.detectCategory(proj.technologies || '');

    const projectUI: ProjectUI = {
      id: proj.id,
      title: proj.title,
      description: proj.description,
      image: imageUrls[0] || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
      images: imageUrls.length > 0 ? imageUrls : [],
      featured: proj.featured,
      technologies: proj.technologies ? proj.technologies.split(',').map(t => t.trim()) : [],
      githubUrl: proj.github_url || undefined,
      demoUrl: proj.demo_url || undefined,
      category
    };

    // Add details if available (for detail view)
    if ('comments' in proj) {
      projectUI.comments = proj.comments || [];
      projectUI.comments_count = proj.comments?.length || 0;
      projectUI.reactions = {
        total_reactions: 0,
        like_count: 0,
        love_count: 0,
        congratulations_count: 0,
        user_reaction: null
      };
    }

    return projectUI;
  }

  private detectCategory(techString: string): string {
    const tech = techString.toLowerCase();

    if (tech.includes('docker') || tech.includes('kubernetes') ||
        tech.includes('jenkins') || tech.includes('ci/cd') ||
        tech.includes('ansible') || tech.includes('terraform')) {
      return 'devops';
    }

    if (tech.includes('aws') || tech.includes('azure') ||
        tech.includes('gcp') || tech.includes('cloud')) {
      return 'cloud';
    }

    return 'web';
  }

  private extractYouTubeId(url: string): string | null {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  }
}
