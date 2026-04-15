import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PublicEvent {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string | null;
  location: string;
  attendees: number;
  status: string;
}

export interface EventRegistrationPayload {
  name: string;
  email: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private readonly apiUrl = 'http://localhost:3000/events';

  constructor(private readonly http: HttpClient) {}

  getUpcomingEvents(): Observable<PublicEvent[]> {
    return this.http.get<PublicEvent[]>(`${this.apiUrl}/upcoming`);
  }

  registerForEvent(eventId: string, payload: EventRegistrationPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/${eventId}/register`, payload);
  }
}
