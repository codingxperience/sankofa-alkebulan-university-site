import { Injectable, inject } from '@angular/core';
import { ApiClient, newRequestId } from './core/api/api-client';

export interface EventOptions {
  attendeeCategories: string[];
  attendanceModes: string[];
  days: string[];
  interests: string[];
}

export type EventRegistrationState =
  | { open: true; waitlist: boolean }
  | { open: false; reason: 'not_published' | 'cancelled' | 'closed' | 'ended' };

export interface PublicEvent {
  slug: string;
  title: string;
  summary: string | null;
  venue: string | null;
  timezone: string;
  startsAt: string;
  endsAt: string | null;
  registrationClosesAt: string;
  registration: EventRegistrationState;
  options: EventOptions;
  consentText: string;
}

export interface PublicEventList {
  upcoming: PublicEvent[];
  archive: PublicEvent[];
}

export interface EventRegistrationPayload {
  name: string;
  email: string;
  phone?: string;
  place?: string;
  organisation?: string;
  role?: string;
  attendeeCategory?: string;
  attendanceMode?: string;
  days?: string;
  interests: string[];
  question?: string;
  accessNeeds?: string;
  wantsUpdates: boolean;
  clientRequestId: string;
  website: string;
}

export interface EventRegistrationResult {
  status: 'CONFIRMED' | 'WAITLISTED';
  code?: string;
  alreadyRegistered: boolean;
  confirmationEmailed: boolean;
}

@Injectable({ providedIn: 'root' })
export class EventsService {
  private readonly api = inject(ApiClient);

  getPublicEvents(): Promise<PublicEventList> {
    return this.api.get<PublicEventList>('/events');
  }

  getPublicEvent(slug: string): Promise<PublicEvent> {
    return this.api.get<PublicEvent>(`/events/${encodeURIComponent(slug)}`);
  }

  registerForEvent(slug: string, payload: Omit<EventRegistrationPayload, 'clientRequestId'> & { clientRequestId?: string }): Promise<EventRegistrationResult> {
    return this.api.post<EventRegistrationResult>(`/events/${encodeURIComponent(slug)}/registrations`, {
      ...payload,
      clientRequestId: payload.clientRequestId ?? newRequestId(),
    });
  }
}
