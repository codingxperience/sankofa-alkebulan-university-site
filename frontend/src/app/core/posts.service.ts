import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Post {
  title: string;
  published_at: string;
  excerpt: string;
  featured_image: string;
  categories: string[];
  tags: string[];
  author: string;
  slug: string;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private apiUrl = 'http://localhost:3000'; // Adjust to backend URL

  constructor(private http: HttpClient) {}

  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/essays`);
  }

  getPost(slug: string): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/essays/${slug}`);
  }
}