import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private API = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'token';
  private expirationTimer: any;

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<{ message: string; token: string; userId: string }> {
    return this.http.post<{ message: string; token: string; userId: string }>(`${this.API}/login`, { email, password })
      .pipe(
        tap(res => {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          this.setupExpirationTimer(res.token);
        })
      );
  }

  register(name: string, email: string, password: string, phone: string) {
    return this.http.post(`${this.API}/register`, {
      name,
      email,
      password,
      phone
    });
  }

  /**
   * Get the Cognito login URL for AWS IAM authentication
   */
  getCognitoLoginUrl(): Observable<{ loginUrl: string }> {
    return this.http.get<{ loginUrl: string }>(`${this.API}/cognito-login`);
  }

  /**
   * Handle Cognito callback - exchange authorization code for session token
   */
  handleCognitoCallback(code: string): Observable<{ message: string; token: string; userId: string; email: string; name: string }> {
    return this.http.post<{ message: string; token: string; userId: string; email: string; name: string }>(`${this.API}/cognito-callback`, { code })
      .pipe(
        tap(res => {
          localStorage.setItem(this.TOKEN_KEY, res.token);
        })
      );
  }

  /**
   * Create session from Cognito ID token (token already exchanged on frontend)
   */
  createSessionFromCognitoToken(idToken: string): Observable<{ message: string; token: string; userId: string; email: string; name: string; role: string }> {
    return this.http.post<{ message: string; token: string; userId: string; email: string; name: string; role: string }>(`${this.API}/cognito-session`, { idToken })
      .pipe(
        tap(res => {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          this.setupExpirationTimer(res.token);
        })
      );
  }
  

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.clearExpirationTimer();
  }

  isLoggedIn() {
    return this.hasValidToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  hasValidToken(): boolean {
    const token = this.getToken();

    if (!token) {
      return false;
    }

    if (this.isTokenExpired(token)) {
      this.logout();
      return false;
    }

    return true;
  }

  getCurrentUser() {
    return this.http.get<{ userId: string; name: string; email: string; phone?: string }>(`${this.API}/me`);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return true;
      }

      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(normalized);
      const parsed = JSON.parse(decoded) as { exp?: number };

      if (!parsed.exp) {
        return true;
      }

      const nowInSeconds = Math.floor(Date.now() / 1000);
      return parsed.exp <= nowInSeconds;
    } catch {
      return true;
    }
  }

  private setupExpirationTimer(token: string): void {
    // Clear any existing timer
    this.clearExpirationTimer();

    try {
      const payload = token.split('.')[1];
      if (!payload) return;

      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(normalized);
      const parsed = JSON.parse(decoded) as { exp?: number };

      if (!parsed.exp) return;

      // Calculate milliseconds until expiration
      const nowInSeconds = Math.floor(Date.now() / 1000);
      const secondsUntilExpiry = parsed.exp - nowInSeconds;
      const msUntilExpiry = secondsUntilExpiry * 1000;

      console.log(`[Auth] Token will expire in ${secondsUntilExpiry} seconds`);

      // Set a timer to logout when token expires (add 100ms buffer for safety)
      this.expirationTimer = setTimeout(() => {
        console.log('[Auth] Token expired - auto-logout triggered');
        this.logout();
        this.router.navigate(['/login']);
      }, msUntilExpiry + 100);
    } catch (error) {
      console.error('[Auth] Error setting up expiration timer:', error);
    }
  }

  private clearExpirationTimer(): void {
    if (this.expirationTimer) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = null;
      console.log('[Auth] Expiration timer cleared');
    }
  }
}
