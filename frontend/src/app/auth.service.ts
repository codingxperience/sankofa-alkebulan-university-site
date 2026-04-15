import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { getSupabaseClient } from './core/supabase-client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  verificationNote?: string;
  verifiedAt?: string;
  provider?: string;
  phoneNumber?: string;
  isVerified?: boolean;
  profilePicture?: string;
  createdAt?: string;
  lastLogin?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
  refreshToken?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/auth';
  private readonly supabase = getSupabaseClient();
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Check for stored token on app start (only in browser)
    if (this.isBrowser()) {
      const token = localStorage.getItem('auth_token');
      const cachedUser = localStorage.getItem('current_user');
      if (token && cachedUser) {
        try {
          this.currentUserSubject.next(JSON.parse(cachedUser));
        } catch {
          this.currentUserSubject.next(null);
        }
      }

      if (token) {
        // Validate token with server
        this.validateToken(token).subscribe({
          next: (user) => {
            this.currentUserSubject.next(user);
          },
          error: () => {
            // Token invalid, clear storage
            this.clearStorage();
          }
        });
      }
    }
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  // Traditional Authentication
  register(email: string, password: string, name: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, { email, password, name })
      .pipe(
        tap(response => {
          this.setSession(response);
        }),
        catchError(error => {
          return throwError(() => error.error?.message || 'Registration failed');
        })
      );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, { email, password })
      .pipe(
        tap(response => {
          this.setSession(response);
        }),
        catchError(error => {
          return throwError(() => error.error?.message || 'Login failed');
        })
      );
  }

  adminLogin(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/admin-login`, { email, password })
      .pipe(
        tap(response => {
          this.setSession(response);
        }),
        catchError(error => {
          return throwError(() => error.error?.message || 'Admin login failed');
        })
      );
  }

  exchangeSupabaseSession(accessToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/supabase/exchange`, { accessToken })
      .pipe(
        tap(response => this.setSession(response)),
        catchError(error => {
          return throwError(() => error.error?.message || 'Supabase session exchange failed');
        })
      );
  }

  async signInWithOAuth(provider: 'google' | 'facebook', redirectPath: string = '/login'): Promise<void> {
    if (!this.isBrowser()) {
      throw new Error('OAuth login requires a browser environment');
    }

    const redirectTo = `${window.location.origin}${redirectPath}`;
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) {
      throw new Error(error.message || 'OAuth sign-in failed');
    }
  }

  async sendPhoneOtp(phoneNumber: string): Promise<void> {
    const phone = String(phoneNumber || '').trim();
    if (!phone) {
      throw new Error('Phone number is required');
    }

    const { error } = await this.supabase.auth.signInWithOtp({ phone });
    if (error) {
      throw new Error(error.message || 'Failed to send OTP');
    }
  }

  async verifyPhoneOtp(phoneNumber: string, verificationCode: string): Promise<string> {
    const phone = String(phoneNumber || '').trim();
    const code = String(verificationCode || '').trim();
    if (!phone || !code) {
      throw new Error('Phone number and verification code are required');
    }

    const { data, error } = await this.supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });
    if (error) {
      throw new Error(error.message || 'Failed to verify OTP');
    }

    const accessToken = data?.session?.access_token;
    if (!accessToken) {
      throw new Error('No Supabase access token after OTP verification');
    }

    return accessToken;
  }

  async getSupabaseAccessToken(): Promise<string | null> {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) {
      throw new Error(error.message || 'Failed to read Supabase session');
    }
    return data.session?.access_token || null;
  }

  // Social Authentication
  googleLogin(idToken: string, profile: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/google`, { idToken, profile })
      .pipe(
        tap(response => {
          this.setSession(response);
        }),
        catchError(error => {
          return throwError(() => error.error?.message || 'Google login failed');
        })
      );
  }

  facebookLogin(accessToken: string, profile: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/facebook`, { accessToken, profile })
      .pipe(
        tap(response => {
          this.setSession(response);
        }),
        catchError(error => {
          return throwError(() => error.error?.message || 'Facebook login failed');
        })
      );
  }

  sendPhoneVerification(phoneNumber: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/phone/send-verification`, { phoneNumber })
      .pipe(
        catchError(error => {
          return throwError(() => error.error?.message || 'Failed to send verification code');
        })
      );
  }

  phoneLogin(phoneNumber: string, verificationCode: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/phone/verify`, { phoneNumber, verificationCode })
      .pipe(
        tap(response => {
          this.setSession(response);
        }),
        catchError(error => {
          return throwError(() => error.error?.message || 'Phone login failed');
        })
      );
  }

  // Token Management
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return throwError(() => 'No refresh token available');
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/refresh`, { refreshToken })
      .pipe(
        tap(response => {
          this.setSession(response);
        }),
        catchError(error => {
          this.logout();
          return throwError(() => 'Token refresh failed');
        })
      );
  }

  validateToken(token: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/profile`, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    });
  }

  // User Profile Management
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/profile`, { headers: this.getHeaders() });
  }

  updateProfile(updates: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/profile`, updates, { headers: this.getHeaders() })
      .pipe(
        tap(updatedUser => {
          this.currentUserSubject.next(updatedUser);
        })
      );
  }

  // Admin User Management
  getAllUsers(page: number = 1, limit: number = 10): Observable<{ users: User[]; total: number; page: number; limit: number; totalPages: number }> {
    return this.http.get<{ users: User[]; total: number; page: number; limit: number; totalPages: number }>(
      `${this.API_URL}/admin/users?page=${page}&limit=${limit}`,
      { headers: this.getHeaders() }
    );
  }

  createUser(email: string, name: string, role?: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/admin/users`, { email, name, role }, { headers: this.getHeaders() });
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/admin/users/${id}`, { headers: this.getHeaders() });
  }

  updateUser(id: string, updates: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/admin/users/${id}`, updates, { headers: this.getHeaders() });
  }

  updateUserVerification(
    id: string,
    status: 'pending' | 'approved' | 'rejected',
    note?: string,
  ): Observable<User> {
    return this.http.put<User>(
      `${this.API_URL}/admin/users/${id}/verification`,
      { status, note },
      { headers: this.getHeaders() },
    );
  }

  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/admin/users/${id}`, { headers: this.getHeaders() });
  }

  getAdminDashboard(): Observable<{ message: string; stats: any }> {
    return this.http.get<{ message: string; stats: any }>(`${this.API_URL}/admin/dashboard`, { headers: this.getHeaders() });
  }

  // Utility Methods
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.currentUser && !!this.getToken();
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  logout(): void {
    this.supabase.auth.signOut().catch(() => {
      // Ignore Supabase sign-out failures; local session is still cleared below.
    });
    this.clearStorage();
    this.currentUserSubject.next(null);
    this.router.navigate(['/home']);
  }

  private setSession(authResult: AuthResponse): void {
    if (this.isBrowser()) {
      localStorage.setItem('auth_token', authResult.token);
      if (authResult.refreshToken) {
        localStorage.setItem('refresh_token', authResult.refreshToken);
      }
      localStorage.setItem('current_user', JSON.stringify(authResult.user));
    }
    this.currentUserSubject.next(authResult.user);
  }

  private clearStorage(): void {
    if (this.isBrowser()) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('current_user');
    }
  }

  getToken(): string | null {
    return this.isBrowser() ? localStorage.getItem('auth_token') : null;
  }

  getRefreshToken(): string | null {
    return this.isBrowser() ? localStorage.getItem('refresh_token') : null;
  }
}
