import { Injectable, inject, signal, computed, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject, interval, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../interfaces/user.interface';
import {
  LoginRequest,
  LoginResponse,
  Verify2FARequest,
  EnableTOTPRequest,
  EnableTOTPResponse,
  VerifyTOTPRequest,
  PasswordChangeRequest,
} from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = `${environment.apiUrl}/auth`;

  private readonly KEYS = { TOKEN: 'access_token', USER: 'user_data', TEMP_TOKEN: 'temp_token' };
  private readonly TIMERS = { REFRESH: 25 * 60 * 1000, ACTIVITY: 60 * 1000, INACTIVITY: 30 * 60 * 1000 };

  private currentUserSignal = signal<User | null>(null);
  private accessTokenSignal = signal<string | null>(null);
  private tempTokenSignal = signal<string | null>(null);
  private available2faMethodsSignal = signal<string[]>([]);
  private loadingSignal = signal<boolean>(false);
  private userLoadedSubject = new BehaviorSubject<boolean>(false);

  private lastActivity = Date.now();
  private subscriptions: Subscription[] = [];

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly tempToken = this.tempTokenSignal.asReadonly();
  readonly available2faMethods = this.available2faMethodsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly userLoaded$ = this.userLoadedSubject.asObservable();

  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isAdmin = computed(() => this.currentUserSignal()?.is_superuser ?? false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeAuth();
      this.setupActivityListeners();
    }
  }

  ngOnDestroy() {
    this.stopTimers();
    this.removeActivityListeners();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.loadingSignal.set(true);
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => res.requires_2fa ? this.handle2FARequired(res) : this.handleLoginSuccess(res)),
      catchError(err => { this.loadingSignal.set(false); return throwError(() => err); })
    );
  }

  verify2FA(data: Verify2FARequest): Observable<LoginResponse> {
    this.loadingSignal.set(true);
    return this.http.post<LoginResponse>(`${this.apiUrl}/verify-2fa`, data).pipe(
      tap(res => this.handleLoginSuccess(res)),
      catchError(err => { this.loadingSignal.set(false); return throwError(() => err); })
    );
  }

  requestEmailCode(tempToken: string) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/request-email-code`, { temp_token: tempToken });
  }

  refreshToken() {
    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, {}).pipe(
      tap(res => this.updateSession(res.access_token, res.user!)),
      catchError(err => { this.logout(); return throwError(() => err); })
    );
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap((user) => this.setUser(user))
    );
  }

  logout() {
    this.stopTimers();
    this.clearSession();
    this.router.navigate(['/private/user/me/login']);
  }

  enableTOTP(req: EnableTOTPRequest) {
    return this.http.post<EnableTOTPResponse>(`${this.apiUrl}/enable-totp`, req);
  }

  verifyTOTP(req: VerifyTOTPRequest) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/verify-totp`, req);
  }

  disableTOTP(req: EnableTOTPRequest) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/disable-totp`, req);
  }

  enableEmail2FA(req: EnableTOTPRequest) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/enable-email-2fa`, req);
  }

  disableEmail2FA(req: EnableTOTPRequest) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/disable-email-2fa`, req);
  }

  changePassword(req: PasswordChangeRequest) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/change-password`, req);
  }

  getToken() { return this.accessTokenSignal(); }

  private updateActivity() { this.lastActivity = Date.now(); }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return (Date.now() / 1000) >= payload.exp;
    } catch { return true; }
  }

  private initializeAuth() {
    const token = localStorage.getItem(this.KEYS.TOKEN);
    const user = localStorage.getItem(this.KEYS.USER);

    if (token && user && !this.isTokenExpired(token)) {
      this.updateSession(token, JSON.parse(user));
      this.startTimers();
    } else {
      this.clearSession();
    }

    const tempToken = localStorage.getItem(this.KEYS.TEMP_TOKEN);
    if (tempToken) this.tempTokenSignal.set(tempToken);

    this.userLoadedSubject.next(true);
  }

  private handleLoginSuccess(res: LoginResponse) {
    this.updateSession(res.access_token, res.user!);
    this.loadingSignal.set(false);
    this.router.navigate(['/admin']);
    this.startTimers();
  }

  private handle2FARequired(res: LoginResponse) {
    this.tempTokenSignal.set(res.temp_token!);
    this.available2faMethodsSignal.set(res.available_2fa_methods || ['email']);
    localStorage.setItem(this.KEYS.TEMP_TOKEN, res.temp_token!);
    this.loadingSignal.set(false);
    this.router.navigate(['/private/user/me/verify-2fa']);
  }

  private updateSession(token: string, user: User) {
    this.accessTokenSignal.set(token);
    this.setUser(user);
    localStorage.setItem(this.KEYS.TOKEN, token);

    this.tempTokenSignal.set(null);
    localStorage.removeItem(this.KEYS.TEMP_TOKEN);
  }

  private setUser(user: User) {
    this.currentUserSignal.set(user);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.KEYS.USER, JSON.stringify(user));
    }
  }

  private clearSession() {
    this.currentUserSignal.set(null);
    this.accessTokenSignal.set(null);
    this.tempTokenSignal.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.KEYS.TOKEN);
      localStorage.removeItem(this.KEYS.USER);
      localStorage.removeItem(this.KEYS.TEMP_TOKEN);
    }
  }

  private startTimers() {
    this.stopTimers();
    this.subscriptions.push(
      interval(this.TIMERS.REFRESH).subscribe(() => this.refreshToken().subscribe()),
      interval(this.TIMERS.ACTIVITY).subscribe(() => {
        if (Date.now() - this.lastActivity >= this.TIMERS.INACTIVITY) this.logout();
      })
    );
  }

  private stopTimers() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  private setupActivityListeners() {
    if (isPlatformBrowser(this.platformId)) {
      ['click', 'keydown', 'scroll', 'mousemove'].forEach(evt =>
        window.addEventListener(evt, () => this.updateActivity())
      );
    }
  }

  private removeActivityListeners() {
    if (isPlatformBrowser(this.platformId)) {
      ['click', 'keydown', 'scroll', 'mousemove'].forEach(evt =>
        window.removeEventListener(evt, () => this.updateActivity())
      );
    }
  }
}
