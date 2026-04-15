import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface AdminActivity {
  id: string;
  type: 'post' | 'event' | 'user' | 'order';
  title: string;
  user: string;
  action: string;
  timestamp: string;
}

export interface AdminDashboardSummary {
  totalPosts: number;
  totalEvents: number;
  totalProducts: number;
  totalRevenue: number;
  recentActivity: AdminActivity[];
}

export interface AdminPost {
  id: string;
  title: string;
  slug?: string;
  content?: string;
  author: string;
  status: 'published' | 'draft' | 'archived';
  created_at: string;
  published_at: string;
}

export interface AdminEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  status: 'active' | 'inactive' | 'draft';
  attendees: number;
  description?: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: 'available' | 'out_of_stock' | 'discontinued';
  category: string;
  description?: string;
}

export interface AdminOrder {
  id: string;
  customer: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'canceled';
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminDataService {
  private readonly apiUrl = 'http://localhost:3000/admin';

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {}

  getDashboardSummary(): Observable<AdminDashboardSummary> {
    return this.http.get<AdminDashboardSummary>(`${this.apiUrl}/dashboard`, {
      headers: this.getHeaders(),
    });
  }

  getPosts(): Observable<AdminPost[]> {
    return this.http.get<AdminPost[]>(`${this.apiUrl}/posts`, {
      headers: this.getHeaders(),
    });
  }

  createPost(payload: {
    title: string;
    content: string;
    slug?: string;
    published?: boolean;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/posts`, payload, {
      headers: this.getHeaders(),
    });
  }

  updatePost(
    id: string,
    payload: { title?: string; content?: string; slug?: string; published?: boolean },
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/posts/${id}`, payload, {
      headers: this.getHeaders(),
    });
  }

  deletePost(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/posts/${id}`, {
      headers: this.getHeaders(),
    });
  }

  getEvents(): Observable<AdminEvent[]> {
    return this.http.get<AdminEvent[]>(`${this.apiUrl}/events`, {
      headers: this.getHeaders(),
    });
  }

  createEvent(payload: {
    title: string;
    date: string;
    location?: string;
    attendees?: number;
    status?: AdminEvent['status'];
    description?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/events`, payload, {
      headers: this.getHeaders(),
    });
  }

  updateEvent(
    id: string,
    payload: {
      title?: string;
      date?: string;
      location?: string;
      attendees?: number;
      status?: AdminEvent['status'];
      description?: string;
    },
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/events/${id}`, payload, {
      headers: this.getHeaders(),
    });
  }

  deleteEvent(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/events/${id}`, {
      headers: this.getHeaders(),
    });
  }

  getProducts(): Observable<AdminProduct[]> {
    return this.http.get<AdminProduct[]>(`${this.apiUrl}/products`, {
      headers: this.getHeaders(),
    });
  }

  createProduct(payload: {
    name: string;
    price: number;
    stock?: number;
    status?: AdminProduct['status'];
    category?: string;
    description?: string;
    sku?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/products`, payload, {
      headers: this.getHeaders(),
    });
  }

  updateProduct(
    id: string,
    payload: {
      name?: string;
      price?: number;
      stock?: number;
      status?: AdminProduct['status'];
      category?: string;
      description?: string;
      sku?: string;
    },
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/products/${id}`, payload, {
      headers: this.getHeaders(),
    });
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`, {
      headers: this.getHeaders(),
    });
  }

  getOrders(): Observable<AdminOrder[]> {
    return this.http.get<AdminOrder[]>(`${this.apiUrl}/orders`, {
      headers: this.getHeaders(),
    });
  }

  updateOrder(
    id: string,
    payload: { total?: number; status?: AdminOrder['status'] },
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${id}`, payload, {
      headers: this.getHeaders(),
    });
  }

  deleteOrder(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/orders/${id}`, {
      headers: this.getHeaders(),
    });
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }
}
