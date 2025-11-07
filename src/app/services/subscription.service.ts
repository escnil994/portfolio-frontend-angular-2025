import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SubscribeResponse {
  message: string;
  verified: boolean;
}

export interface VerifyResponse {
  message: string;
  verified: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/subscribes`;

  subscribe(email: string): Observable<SubscribeResponse> {
    return this.http.post<SubscribeResponse>(`${this.apiUrl}/subscribe`, { email });
  }

  verify(token: string): Observable<VerifyResponse> {
    return this.http.post<VerifyResponse>(`${this.apiUrl}/verify`, { token });
  }

  unsubscribe(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/unsubscribe`, { email });
  }
}
