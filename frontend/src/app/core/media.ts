import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';

export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  type: 'audio' | 'video';
  uploadedAt: string;
  metadata?: {
    duration?: number;
    bitrate?: number;
    resolution?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private apiUrl = 'http://localhost:3000/media';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  uploadFile(file: File): Observable<MediaFile> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<MediaFile>(`${this.apiUrl}/upload`, formData, {
      headers: this.getHeaders(),
    });
  }

  getAllMedia(): Observable<MediaFile[]> {
    return this.http.get<MediaFile[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getAudioFiles(): Observable<MediaFile[]> {
    return this.http.get<MediaFile[]>(`${this.apiUrl}/audio`, { headers: this.getHeaders() });
  }

  getVideoFiles(): Observable<MediaFile[]> {
    return this.http.get<MediaFile[]>(`${this.apiUrl}/video`, { headers: this.getHeaders() });
  }

  getMediaById(id: string): Observable<MediaFile> {
    return this.http.get<MediaFile>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  deleteMedia(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  getMediaStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats/summary`, { headers: this.getHeaders() });
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }
}
