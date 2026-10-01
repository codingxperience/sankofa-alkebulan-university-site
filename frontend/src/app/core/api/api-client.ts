import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

/**
 * Everything the API can say went wrong, in one shape:
 *   code    — stable and machine-readable ("rate_limited", "stale_version")
 *   message — written for the person in front of the screen
 *   fields  — per-field messages, keyed by the field's path ("customer.phone")
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields: Record<string, string> = {},
    readonly details?: unknown,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static from(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return new ApiError(0, 'network', 'We could not reach the university’s servers. Check your connection and try again.');
      }
      const body = error.error?.error;
      if (body && typeof body.message === 'string') {
        return new ApiError(error.status, body.code ?? 'error', body.message, body.fields ?? {}, body.details, body.requestId);
      }
      return new ApiError(error.status, 'error', 'Something went wrong on our side. Please try again in a moment.');
    }
    return new ApiError(0, 'unknown', 'Something unexpected happened. Please try again.');
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

/**
 * The one way the site talks to its API. The API is served from the same
 * origin under /api, so cookies stay first-party and no CORS is involved.
 * Calls return promises, which read naturally alongside signals.
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);

  get<T>(path: string, query?: Query, headers?: Record<string, string>): Promise<T> {
    return this.send(this.http.get<T>(this.url(path), { params: this.params(query), headers: new HttpHeaders(headers ?? {}) }));
  }

  post<T>(path: string, body: unknown = {}): Promise<T> {
    return this.send(this.http.post<T>(this.url(path), body));
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.send(this.http.put<T>(this.url(path), body));
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.send(this.http.patch<T>(this.url(path), body));
  }

  delete<T>(path: string): Promise<T> {
    return this.send(this.http.delete<T>(this.url(path)));
  }

  /** Absolute path for links the browser follows itself, such as CSV downloads. */
  url(path: string, query?: Query): string {
    const base = `/api${path.startsWith('/') ? path : `/${path}`}`;
    const params = this.params(query).toString();
    return params ? `${base}?${params}` : base;
  }

  private params(query?: Query): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }

  private async send<T>(request: ReturnType<HttpClient['get']>): Promise<T> {
    try {
      return (await firstValueFrom(request)) as T;
    } catch (error) {
      throw ApiError.from(error);
    }
  }
}

/** A fresh idempotency key for each submission attempt; retries reuse it. */
export function newRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for very old browsers: RFC 4122 v4 from Math.random.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
