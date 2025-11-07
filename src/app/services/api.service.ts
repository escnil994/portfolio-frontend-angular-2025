import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, timeout, catchError, of } from 'rxjs';
import {
  Profile,
  Project,
  ProjectWithDetails,
  BlogPost,
  BlogPostWithDetails,
  Comment,
  CommentCreate,
  ContactMessage,
  MessageResponse,
} from '../interfaces/portfolio.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  profile = signal<Profile | null>(null);
  projects = signal<Project[]>([]);
  blogPosts = signal<BlogPost[]>([]);
  loading = signal<boolean>(false);
  profileLoading = signal<boolean>(false);
  projectsLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  getProfile(): Observable<Profile> {
    this.profileLoading.set(true);
    this.error.set(null);

    return this.http.get<Profile>(`${this.apiUrl}/profiles/`).pipe(
      timeout(10000),
      tap((profile) => {

        if (profile.skills && typeof profile.skills === 'string') {
          try {
            profile.skills = JSON.parse(profile.skills);
          } catch (e) {
            console.error('Error parsing skills:', e);
            profile.skills = null;
          }
        }

        this.profile.set(profile);
        this.profileLoading.set(false);
      }),
      catchError((err) => {
        console.error('Error loading profile:', err);
        this.error.set('Failed to load profile');
        this.profileLoading.set(false);
        return of(null as any);
      })
    );
  }

  getProjects(skip: number = 0, limit: number = 12, featured?: boolean): Observable<Project[]> {

    this.projectsLoading.set(true);
    this.error.set(null);

    const params: any = { skip, limit };
    if (featured !== undefined) {
      params.featured = featured;
    }

    return this.http.get<Project[]>(`${this.apiUrl}/projects/`, { params }).pipe(
      timeout(10000),
      tap((projects) => {
        this.projects.set(projects);
        this.projectsLoading.set(false);
      }),
      catchError((err) => {
        console.error('❌ ApiService: Error loading projects:', err);
        this.error.set('Failed to load projects');
        this.projectsLoading.set(false);
        return of([]);
      })
    );
  }
  getProject(id: number): Observable<ProjectWithDetails> {
    this.loading.set(true);

    return this.http.get<ProjectWithDetails>(`${this.apiUrl}/projects/${id}`).pipe(
      timeout(10000),
      tap((project) => {
        this.loading.set(false);
      }),
      catchError((err) => {
        console.error('Error loading project:', err);
        this.loading.set(false);
        return of(null as any);
      })
    );
  }

  addProjectComment(projectId: number, comment: CommentCreate): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/projects/${projectId}/comments`, comment);
  }

  getBlogPosts(
    skip: number = 0,
    limit: number = 10,
    published: boolean = true
  ): Observable<BlogPost[]> {
    this.loading.set(true);
    const params = { skip, limit, published };

    return this.http.get<BlogPost[]>(`${this.apiUrl}/blog/`, { params }).pipe(
      timeout(10000),
      tap((posts) => {
        this.blogPosts.set(posts);
        this.loading.set(false);
      }),
      catchError((err) => {
        this.loading.set(false);
        return of([]);
      })
    );
  }

  getBlogPost(slug: string): Observable<BlogPostWithDetails> {
    this.loading.set(true);
    return this.http.get<BlogPostWithDetails>(`${this.apiUrl}/blog/${slug}`).pipe(
      timeout(10000),
      tap(() => this.loading.set(false)),
      catchError((err) => {
        this.loading.set(false);
        return of(null as any);
      })
    );
  }

  addBlogComment(postId: number, comment: CommentCreate): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/blog/${postId}/comments`, comment);
  }

  sendContactMessage(message: ContactMessage): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/contact/`, message);
  }

  parseSkills(skillsJson: string | null): string[] {
    if (!skillsJson) return [];
    try {
      return JSON.parse(skillsJson);
    } catch {
      return [];
    }
  }

  parseTechnologies(techJson: string | null): string[] {
    if (!techJson) return [];
    try {
      return JSON.parse(techJson);
    } catch {
      return [];
    }
  }

  parseTags(tagsJson: string | null): string[] {
    if (!tagsJson) return [];
    try {
      return JSON.parse(tagsJson);
    } catch {
      return [];
    }
  }

  getYouTubeEmbedUrl(url: string): string {
    const videoId = this.extractYouTubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  private extractYouTubeVideoId(url: string): string | null {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
}
