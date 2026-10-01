import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiClient, ApiError, newRequestId } from '../core/api/api-client';

interface Office {
  readonly key: string;
  readonly icon: string;
  readonly title: string;
  readonly focus: string;
  readonly handler: string;
  readonly response: string;
  readonly detail: string;
}

interface Department {
  readonly key: string;
  readonly label: string;
  readonly icon: string;
  readonly office: string;
}

/** The API's name for each office on this page. */
const API_OFFICE: Record<string, string> = {
  admissions: 'ADMISSIONS',
  programmes: 'PROGRAMMES',
  research: 'RESEARCH',
  student: 'STUDENT_LIFE',
  governance: 'GOVERNANCE',
  media: 'MEDIA',
  general: 'CENTRAL',
};

interface InquiryReceipt {
  readonly reference: string;
  readonly office: { readonly label: string; readonly responseTarget: string };
  readonly acknowledgementEmailed: boolean;
}

type Field = 'name' | 'email' | 'origin' | 'message' | 'website';

const OFFICES: readonly Office[] = [
  {
    key: 'admissions',
    icon: 'fa-file-signature',
    title: 'Admissions Office',
    focus: 'Applications, entry, scholarships, documents',
    handler: 'Admissions Office',
    response: '2–3 days',
    detail:
      'Applications, entry requirements, study levels, scholarships, and document readiness for domestic and international applicants.',
  },
  {
    key: 'programmes',
    icon: 'fa-book-open',
    title: 'Academic Pathways',
    focus: 'Programmes, colleges, schools, routes',
    handler: 'Academic Pathways',
    response: '3–5 days',
    detail:
      'Programmes, colleges, schools, research alignment, and learning routes across the academic estate.',
  },
  {
    key: 'research',
    icon: 'fa-flask',
    title: 'Research & Partnerships',
    focus: 'Institutes, collaboration, conferences',
    handler: 'Research & Partnerships',
    response: '3–5 days',
    detail:
      'Research institutes, public scholarship, conferences, funding, and institutional collaboration.',
  },
  {
    key: 'student',
    icon: 'fa-people-group',
    title: 'Student Systems',
    focus: 'Student life, societies, support',
    handler: 'Student Systems',
    response: '2–4 days',
    detail:
      'Student life, clubs, cultural societies, professional societies, wellbeing, and support services.',
  },
  {
    key: 'governance',
    icon: 'fa-landmark',
    title: 'Governance & Administration',
    focus: 'Charter, policy, records, compliance',
    handler: 'Governance & Administration',
    response: '5–7 days',
    detail:
      'Charter, policy, quality assurance, accreditation status, and administrative correspondence.',
  },
  {
    key: 'media',
    icon: 'fa-newspaper',
    title: 'Media & Public Scholarship',
    focus: 'Press, interviews, publications',
    handler: 'Media & Public Scholarship',
    response: '3–5 days',
    detail: 'Press enquiries, interviews, films, publications, and public scholarship requests.',
  },
  {
    key: 'general',
    icon: 'fa-circle-question',
    title: 'Central Desk',
    focus: 'General enquiries and routing',
    handler: 'the Central Desk',
    response: '2–4 days',
    detail:
      'General enquiries are triaged at the central desk and routed to the correct office for you.',
  },
];

const DEPARTMENTS: readonly Department[] = [
  { key: 'admissions', label: 'Admissions', icon: 'fa-file-signature', office: 'admissions' },
  { key: 'programmes', label: 'Academic Programmes', icon: 'fa-book-open', office: 'programmes' },
  { key: 'research', label: 'Research & Partnerships', icon: 'fa-flask', office: 'research' },
  { key: 'student', label: 'Student Life', icon: 'fa-people-group', office: 'student' },
  { key: 'governance', label: 'Governance & Administration', icon: 'fa-landmark', office: 'governance' },
  { key: 'media', label: 'Media & Public Scholarship', icon: 'fa-newspaper', office: 'media' },
  { key: 'general', label: 'General Inquiry', icon: 'fa-circle-question', office: 'general' },
];

const FAQS = [
  {
    question: 'Which email should I use for official inquiries?',
    answer:
      'Write through the form above: choosing an office sends your message straight to its team and gives you a reference number. You can also email SanAlkeU@outlook.com for documents, partnership letters, media requests, and administrative correspondence.',
  },
  {
    question: 'How do prospective students apply?',
    answer:
      'Open Admissions, choose postgraduate, undergraduate, or certificate application, complete the form, and include your programme interest, intake, country, and contact details.',
  },
  {
    question: 'Can international applicants apply?',
    answer:
      'Yes. International applicants use the same online pathway and should provide their country, previous qualifications, programme choice, and available academic documents.',
  },
  {
    question: 'Where is the University located?',
    answer:
      'Sankofa is currently a digital-first Pan-African university model while future campus locations and partner hubs are developed. Contact administration for current updates.',
  },
  {
    question: 'Does the University have a charter or accreditation status?',
    answer:
      'Governance & Administration is the reference point for charter, policy, quality assurance, and accreditation updates. For current official status, contact them directly.',
  },
  {
    question: 'How do I reach the Founder / Chancellor office?',
    answer:
      'Use 0765871126 or 0706938536 for founder/chancellor matters. Routine admissions and document questions should still be sent by email for proper records.',
  },
];

const EMAIL = 'SanAlkeU@outlook.com';

@Component({
  selector: 'app-contact-page',
  imports: [RouterLink],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPageComponent {
  readonly offices = OFFICES;
  readonly departments = DEPARTMENTS;
  readonly universityEmail = EMAIL;

  private readonly api = inject(ApiClient);

  readonly dept = signal('admissions');
  readonly openFaq = signal(0);

  readonly form = signal<Record<Field, string>>({ name: '', email: '', origin: '', message: '', website: '' });
  readonly sending = signal(false);
  readonly receipt = signal<InquiryReceipt | null>(null);
  readonly error = signal<ApiError | null>(null);
  readonly fieldErrors = computed(() => this.error()?.fields ?? {});
  /** Errors that belong to no single field are shown above the button. */
  readonly bannerError = computed(() => {
    const error = this.error();
    return error && Object.keys(error.fields).length === 0 ? error : null;
  });
  /** One id per message: a retry after a dropped connection cannot create a duplicate. */
  private requestId = newRequestId();

  readonly channels = [
    {
      label: 'Email',
      value: EMAIL,
      description: 'Best for formal inquiries, documents, admissions, and administrative routing.',
      href: 'mailto:' + EMAIL,
      target: '_self',
      tone: 'email',
      iconType: 'solid',
      icon: 'fa-envelope',
    },
    {
      label: 'WhatsApp live chat',
      value: 'Community support',
      description: 'Fastest path for lightweight questions, applicant guidance, and quick follow-up.',
      href: 'https://chat.whatsapp.com/Dv2lTXXzhfMDf6sClAxpEP',
      target: '_blank',
      tone: 'whatsapp',
      iconType: 'brands',
      icon: 'fa-whatsapp',
    },
    {
      label: 'Founder / Chancellor',
      value: '0765871126 · 0706938536',
      description: 'Leadership contact for founding, institutional, and high-priority matters.',
      href: 'tel:0765871126',
      target: '_self',
      tone: 'phone',
      iconType: 'solid',
      icon: 'fa-phone',
    },
  ];

  readonly faqs = FAQS;

  readonly locations = [
    {
      eyebrow: 'Primary access',
      title: 'Digital Contact Center',
      description:
        'One structured channel for admissions, administration, partnerships, and student-support routing.',
      meta: 'Email · WhatsApp · inquiry form',
      tone: 'dark',
    },
    {
      eyebrow: 'Campus planning',
      title: 'Future Campus Locations',
      description:
        'Sankofa is building toward physical, hybrid, and partner-based learning locations across Pan-African networks.',
      meta: 'Uganda · continental partner hubs',
      tone: 'light',
    },
  ];

  get activeDepartment(): Department {
    return DEPARTMENTS.find((d) => d.key === this.dept()) || DEPARTMENTS[0];
  }

  get routed(): Office {
    const dept = this.activeDepartment;
    return OFFICES.find((o) => o.key === dept.office) || OFFICES[0];
  }

  setDept(event: Event): void {
    this.dept.set((event.target as HTMLSelectElement).value);
  }

  setField(field: Field, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.form.update((f) => ({ ...f, [field]: value }));
    if (this.fieldErrors()[field]) {
      const { [field]: _cleared, ...rest } = this.fieldErrors();
      const current = this.error();
      this.error.set(current ? new ApiError(current.status, current.code, current.message, rest) : null);
    }
  }

  toggleFaq(i: number): void {
    this.openFaq.update((open) => (open === i ? -1 : i));
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.sending()) {
      return;
    }
    const f = this.form();
    this.sending.set(true);
    this.error.set(null);
    try {
      const receipt = await this.api.post<InquiryReceipt>('/inquiries', {
        office: API_OFFICE[this.activeDepartment.key] ?? 'CENTRAL',
        source: 'CONTACT_PAGE',
        name: f.name,
        email: f.email,
        origin: f.origin,
        message: f.message,
        website: f.website,
        clientRequestId: this.requestId,
      });
      this.receipt.set(receipt);
    } catch (error) {
      this.error.set(ApiError.from(error));
    } finally {
      this.sending.set(false);
    }
  }

  writeAnother(): void {
    this.receipt.set(null);
    this.error.set(null);
    this.requestId = newRequestId();
    this.form.update((f) => ({ ...f, message: '', website: '' }));
  }

  /** Used only when the network is down: the same message, pre-addressed in the visitor's mail app. */
  get mailtoFallback(): string {
    const dept = this.activeDepartment;
    const f = this.form();
    const subject = encodeURIComponent(`[${dept.label}] Enquiry — Sankofa Alkebulan University`);
    const body = encodeURIComponent(
      `Office: ${dept.label}\nName: ${f.name}\nEmail: ${f.email}\nFrom: ${f.origin}\n\n${f.message}`,
    );
    return `mailto:${EMAIL}?subject=${subject}&body=${body}`;
  }
}
