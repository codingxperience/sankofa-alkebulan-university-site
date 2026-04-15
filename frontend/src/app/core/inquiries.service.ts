import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdmissionsInquiryPayload {
  fullName: string;
  email: string;
  country: string;
  studyLevel: string;
  preferredSchool: string;
  notes?: string;
}

export interface ContactInquiryPayload {
  fullName: string;
  email: string;
  department: string;
  subject: string;
  message: string;
}

export interface InquiryResponse {
  message: string;
  inquiry: {
    id: string;
    type: string;
    createdAt: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class InquiriesService {
  private readonly apiUrl = 'http://localhost:3000/inquiries';

  constructor(private readonly http: HttpClient) {}

  submitAdmissionsInquiry(payload: AdmissionsInquiryPayload): Observable<InquiryResponse> {
    return this.http.post<InquiryResponse>(`${this.apiUrl}/admissions`, payload);
  }

  submitContactInquiry(payload: ContactInquiryPayload): Observable<InquiryResponse> {
    return this.http.post<InquiryResponse>(`${this.apiUrl}/contact`, payload);
  }
}
