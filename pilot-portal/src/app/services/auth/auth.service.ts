import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private API = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'token';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<{ message: string; token: string; userId: string }> {
    return this.http.post<{ message: string; token: string; userId: string }>(`${this.API}/login`, { email, password })
      .pipe(
        tap(res => {
          localStorage.setItem(this.TOKEN_KEY, res.token);
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
  

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
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
}
