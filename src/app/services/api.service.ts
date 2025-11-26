import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, timeout, catchError, of, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Profile } from '../interfaces/user.interface';
import { ContactMessage, MessageResponse } from '../interfaces/portfolio.interface';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  profile = signal<Profile | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  getProfile(): Observable<Profile> {
    this.loading.set(true);
    return this.http.get<Profile>(`${this.apiUrl}/profiles/`).pipe(
      timeout(10000),
      tap((profile) => {
        if (profile.skills && typeof profile.skills === 'string') {
          try {
            profile.skills = JSON.parse(profile.skills);
          } catch {
            profile.skills = null;
          }
        }
        this.profile.set(profile);
        this.loading.set(false);
      }),
      catchError((err) => {
        this.error.set('Failed to load profile');
        this.loading.set(false);
        return of(null as any);
      })
    );
  }

  sendContactMessage(message: ContactMessage): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/contact/`, message);
  }

  parseJsonString(jsonString: string | null): string[] {
    if (!jsonString) return [];
    try {
      return JSON.parse(jsonString);
    } catch {
      return [];
    }
  }

  getYouTubeEmbedUrl(url: string): string {
    const videoId = this.extractYouTubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  private extractYouTubeVideoId(url: string): string | null {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
}
