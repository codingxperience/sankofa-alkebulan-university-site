import { Injectable, inject } from '@angular/core';
import { ApiClient, ApiError } from '../../core/api/api-client';
import { StaffSession } from './staff-session';

type Query = Record<string, string | number | boolean | null | undefined>;

/**
 * The console's door to the API. Identical to ApiClient, except that a 401
 * anywhere means the session has ended, and the person is taken back to
 * sign in — returning to the same screen afterwards.
 */
@Injectable({ providedIn: 'root' })
export class ConsoleApi {
  private readonly api = inject(ApiClient);
  private readonly session = inject(StaffSession);

  get<T>(path: string, query?: Query): Promise<T> {
    return this.guard(this.api.get<T>(`/admin${path}`, query));
  }

  post<T>(path: string, body: unknown = {}): Promise<T> {
    return this.guard(this.api.post<T>(`/admin${path}`, body));
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.guard(this.api.put<T>(`/admin${path}`, body));
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.guard(this.api.patch<T>(`/admin${path}`, body));
  }

  delete<T>(path: string): Promise<T> {
    return this.guard(this.api.delete<T>(`/admin${path}`));
  }

  /** A link the browser downloads itself; the session cookie travels with it. */
  url(path: string, query?: Query): string {
    return this.api.url(`/admin${path}`, query);
  }

  private async guard<T>(request: Promise<T>): Promise<T> {
    try {
      return await request;
    } catch (error) {
      const failure = ApiError.from(error);
      if (failure.status === 401) {
        this.session.ended();
      }
      throw failure;
    }
  }
}
