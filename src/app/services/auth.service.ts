import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import {
  LoginRequest,
  LoginResponse,
  Verify2FARequest,
  User,
  EnableTOTPRequest,
  EnableTOTPResponse,
  VerifyTOTPRequest,
  PasswordChangeRequest,
} from '../interfaces/auth.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Inyección de dependencias
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  // Constantes privadas
  private readonly TOKEN_KEY = 'access_token';
  private readonly TEMP_TOKEN_KEY = 'temp_token';

  // Señales y Sujetos de estado privado
  private currentUserSignal = signal<User | null>(null);
  private accessTokenSignal = signal<string | null>(null);
  private tempTokenSignal = signal<string | null>(null);
  private loadingSignal = signal<boolean>(false);
  private userLoadedSubject = new BehaviorSubject<boolean>(false);

  // Estado público (solo lectura)
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly tempToken = this.tempTokenSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly userLoaded$ = this.userLoadedSubject.asObservable();

  // Estado computado
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isAdmin = computed(() => this.currentUserSignal()?.is_superuser ?? false);
  readonly has2FA = computed(() => {
    const user = this.currentUserSignal();
    return user?.email_2fa_enabled || user?.totp_enabled || false;
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const tempToken = localStorage.getItem(this.TEMP_TOKEN_KEY);

      if (token) {
        this.accessTokenSignal.set(token);
        this.loadCurrentUser();
      } else {
        this.userLoadedSubject.next(true);
      }

      if (tempToken) {
        this.tempTokenSignal.set(tempToken);
      }
    }
  }

  // --- Métodos Públicos (Autenticación) ---

  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.loadingSignal.set(true);

    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        if (response.requires_2fa && response.temp_token) {
          this.tempTokenSignal.set(response.temp_token);
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.TEMP_TOKEN_KEY, response.temp_token);
          }
          this.router.navigate(['/private/user/me/verify-2fa']);
        } else if (response.access_token) {
          this.setAccessToken(response.access_token);
          this.loadCurrentUser();
          this.router.navigate(['/admin']);
        }
      }),
      catchError((error) => {
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  verify2FA(data: Verify2FARequest): Observable<LoginResponse> {
    this.loadingSignal.set(true);

    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/verify-2fa`, data).pipe(
      tap((response) => {
        if (response.access_token) {
          this.setAccessToken(response.access_token);
          this.clearTempToken();
          this.loadCurrentUser();
          this.router.navigate(['/admin']);
        }
      }),
      catchError((error) => {
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.currentUserSignal.set(null);
    this.accessTokenSignal.set(null);
    this.clearTempToken();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
    }
    this.router.navigate(['/login']);
  }

  // --- Métodos Públicos (Gestión de 2FA y Contraseña) ---

  enableTOTP(request: EnableTOTPRequest): Observable<EnableTOTPResponse> {
    return this.http.post<EnableTOTPResponse>(`${environment.apiUrl}/auth/enable-totp`, request);
  }

  verifyTOTP(request: VerifyTOTPRequest): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${environment.apiUrl}/auth/verify-totp`, request)
      .pipe(tap(() => this.loadCurrentUser()));
  }

  disableTOTP(request: EnableTOTPRequest): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${environment.apiUrl}/auth/disable-totp`, request)
      .pipe(tap(() => this.loadCurrentUser()));
  }

  changePassword(request: PasswordChangeRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/auth/change-password`,
      request
    );
  }

  // --- Métodos Públicos (Helpers) ---

  getToken(): string | null {
    return this.accessTokenSignal();
  }

  // --- Métodos Privados ---

  private loadCurrentUser(): void {
    this.http.get<User>(`${environment.apiUrl}/auth/me`)
      .pipe(
        tap(user => {
          this.currentUserSignal.set(user);
          this.loadingSignal.set(false);
          this.userLoadedSubject.next(true);
        }),
        catchError(error => {
          this.logout();
          this.loadingSignal.set(false);
          this.userLoadedSubject.next(true);
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  private setAccessToken(token: string): void {
    this.accessTokenSignal.set(token);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  private clearTempToken(): void {
    this.tempTokenSignal.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TEMP_TOKEN_KEY);
    }
  }
}
