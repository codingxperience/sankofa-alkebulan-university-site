import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { ApiClient, newRequestId } from './api/api-client';

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
  reference: string;
  office: { label: string; responseTarget: string };
}

/** The portal forms name offices in words; the API names them by key. */
const OFFICE_BY_DEPARTMENT: Record<string, string> = {
  Admissions: 'ADMISSIONS',
  'Academic Programmes': 'PROGRAMMES',
  'Research and Partnerships': 'RESEARCH',
  'Student Life': 'STUDENT_LIFE',
  'Governance and Administration': 'GOVERNANCE',
  'Media and Public Scholarship': 'MEDIA',
  'General Inquiry': 'CENTRAL',
};

interface Receipt {
  reference: string;
  office: { label: string; responseTarget: string };
  acknowledgementEmailed: boolean;
}

/** Sends the portal pages' admissions and contact forms to the right office. */
@Injectable({ providedIn: 'root' })
export class InquiriesService {
  private readonly api = inject(ApiClient);

  submitAdmissionsInquiry(payload: AdmissionsInquiryPayload): Observable<InquiryResponse> {
    const details: Record<string, string> = {
      Country: payload.country,
      'Study level': payload.studyLevel,
      'Preferred school or programme': payload.preferredSchool,
    };
    return from(
      this.send({
        office: 'ADMISSIONS',
        source: 'ADMISSIONS_DESK',
        name: payload.fullName,
        email: payload.email,
        origin: payload.country,
        subject: `${payload.studyLevel} — ${payload.preferredSchool}`.slice(0, 200),
        message: payload.notes?.trim() || `Admissions enquiry about ${payload.preferredSchool} (${payload.studyLevel}).`,
        details,
      }),
    );
  }

  submitContactInquiry(payload: ContactInquiryPayload): Observable<InquiryResponse> {
    return from(
      this.send({
        office: OFFICE_BY_DEPARTMENT[payload.department] ?? 'CENTRAL',
        source: 'PORTAL_FORM',
        name: payload.fullName,
        email: payload.email,
        subject: payload.subject,
        message: payload.message,
      }),
    );
  }

  private async send(body: Record<string, unknown>): Promise<InquiryResponse> {
    const receipt = await this.api.post<Receipt>('/inquiries', { ...body, clientRequestId: newRequestId() });
    const copy = receipt.acknowledgementEmailed ? ' A copy is on its way to your inbox.' : '';
    return {
      ...receipt,
      message: `Received by ${receipt.office.label} — reference ${receipt.reference}. Expect a reply within ${receipt.office.responseTarget}.${copy}`,
    };
  }
}
