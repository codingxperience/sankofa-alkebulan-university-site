import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UNIVERSITY_PORTAL_PAGES } from '../university/university-data';
import { DEPARTMENT_PAGES } from '../university/department-pages';
import { InquiriesService } from '../core/inquiries.service';
import { firstValueFrom } from 'rxjs';

interface AcademicPathway {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly iconClass: string;
  readonly path: string;
}

interface FeaturedSchool {
  readonly title: string;
  readonly slug: string;
  readonly description: string;
  readonly tag: string;
}

interface AcademicCluster {
  readonly title: string;
  readonly description: string;
  readonly image: string;
  readonly imagePosition: string;
  readonly path: string;
}

@Component({
  selector: 'app-university-section-page',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './university-section-page.component.html',
  styleUrl: './university-section-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UniversitySectionPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly inquiriesService = inject(InquiriesService);

  readonly universityEmail = 'sankofalkebulanuniversity@outlook.com';

  readonly page = computed(() => {
    const slug = this.route.snapshot.data['slug'];
    const sectionSlug = typeof slug === 'string' ? slug : '';

    return UNIVERSITY_PORTAL_PAGES.find((page) => page.slug === sectionSlug) ?? null;
  });

  readonly isAdmissionsPage = computed(() => this.page()?.slug === 'admissions');
  readonly isContactPage = computed(() => this.page()?.slug === 'contact');
  readonly isFacultiesPage = computed(() => this.page()?.slug === 'faculties-schools');

  readonly academicPathways: readonly AcademicPathway[] = [
    {
      eyebrow: 'Start',
      title: 'Programs',
      description: 'Certificates, diplomas, degrees, masters, and doctoral routes.',
      iconClass: 'pi pi-book',
      path: '/programs',
    },
    {
      eyebrow: 'Build',
      title: 'Schools',
      description: 'Focused academic homes with distinct disciplines and identities.',
      iconClass: 'pi pi-sitemap',
      path: '/faculties-schools',
    },
    {
      eyebrow: 'Advance',
      title: 'Research',
      description: 'Applied inquiry across AI, health, governance, climate, and culture.',
      iconClass: 'pi pi-globe',
      path: '/research-innovation',
    },
  ];

  readonly featuredSchools: readonly FeaturedSchool[] = DEPARTMENT_PAGES.slice(0, 6).map(
    (school, index) => ({
      title: school.title,
      slug: school.slug,
      description: this.summarizeAcademicSchool(school.overview),
      tag: ['Heritage', 'Theology', 'Culture', 'Governance', 'Innovation', 'Global'][index] ?? 'School',
    }),
  );

  readonly academicClusters: readonly AcademicCluster[] = [
    {
      title: 'Heritage and Civilization',
      description: 'African knowledge systems, theology, humanities, culture, and public memory.',
      image: '/assets/academics/world-heritage-civilization.jpg',
      imagePosition: '52% center',
      path: '/faculties-schools/college-of-african-civilizational-studies',
    },
    {
      title: 'Governance and Justice',
      description: 'Leadership, law, human rights, policy, peace, and continental institutions.',
      image: '/assets/academics/world-governance-justice.jpg',
      imagePosition: '48% center',
      path: '/faculties-schools/school-of-law-and-human-rights',
    },
    {
      title: 'Science and Intelligence',
      description: 'Engineering, data science, AI, space, mathematics, and applied technologies.',
      image: '/assets/academics/world-science-intelligence.jpg',
      imagePosition: '50% center',
      path: '/faculties-schools/school-of-mathematics-data-science-and-ai',
    },
    {
      title: 'Health and Earth Futures',
      description: 'Biomedical studies, public health, agriculture, climate, and sustainability.',
      image: '/assets/academics/world-health-earth.jpg',
      imagePosition: '48% center',
      path: '/faculties-schools/college-of-health-sciences-and-biomedical-studies',
    },
  ];

  private readonly departmentSlugByTitle = new Map(
    DEPARTMENT_PAGES.map((page) => [page.title, page.slug]),
  );

  getDepartmentSlug(title: string): string | null {
    return this.departmentSlugByTitle.get(title) ?? null;
  }

  private summarizeAcademicSchool(overview: string): string {
    const sentence = overview.trim().split('. ')[0] ?? overview.trim();
    if (sentence.length <= 118) {
      return sentence.endsWith('.') ? sentence : `${sentence}.`;
    }

    return `${sentence.slice(0, 115).trim()}...`;
  }

  readonly admissionsLevels = [
    'Certificate or Diploma',
    'Bachelor Degree',
    'Master Degree',
    'Doctorate',
  ] as const;

  readonly admissionsForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    country: ['', [Validators.required, Validators.minLength(2)]],
    studyLevel: ['', [Validators.required]],
    preferredSchool: ['', [Validators.required, Validators.minLength(4)]],
    notes: [''],
  });

  readonly contactForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    department: ['', [Validators.required, Validators.minLength(3)]],
    subject: ['', [Validators.required, Validators.minLength(5)]],
    message: ['', [Validators.required, Validators.minLength(20)]],
  });

  readonly admissionsStatus = signal('');
  readonly contactStatus = signal('');
  readonly isSubmittingAdmissions = signal(false);
  readonly isSubmittingContact = signal(false);

  async submitAdmissionsForm(): Promise<void> {
    this.admissionsStatus.set('');

    if (this.admissionsForm.invalid) {
      this.admissionsForm.markAllAsTouched();
      this.admissionsStatus.set('Please complete all required admissions fields.');
      return;
    }

    const payload = this.admissionsForm.getRawValue();
    this.isSubmittingAdmissions.set(true);

    try {
      const response = await firstValueFrom(
        this.inquiriesService.submitAdmissionsInquiry({
          fullName: payload.fullName,
          email: payload.email,
          country: payload.country,
          studyLevel: payload.studyLevel,
          preferredSchool: payload.preferredSchool,
          notes: payload.notes || undefined,
        }),
      );
      this.admissionsStatus.set(response.message || 'Admissions inquiry submitted successfully.');
      this.admissionsForm.reset({
        fullName: '',
        email: '',
        country: '',
        studyLevel: '',
        preferredSchool: '',
        notes: '',
      });
    } catch (error: unknown) {
      this.admissionsStatus.set(
        this.extractErrorMessage(error) ||
          'Online submission failed. Use the email fallback button below.',
      );
    } finally {
      this.isSubmittingAdmissions.set(false);
    }
  }

  async submitContactForm(): Promise<void> {
    this.contactStatus.set('');

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      this.contactStatus.set('Please complete all required contact fields.');
      return;
    }

    const payload = this.contactForm.getRawValue();
    this.isSubmittingContact.set(true);

    try {
      const response = await firstValueFrom(
        this.inquiriesService.submitContactInquiry({
          fullName: payload.fullName,
          email: payload.email,
          department: payload.department,
          subject: payload.subject,
          message: payload.message,
        }),
      );
      this.contactStatus.set(response.message || 'Administrative inquiry submitted successfully.');
      this.contactForm.reset({
        fullName: '',
        email: '',
        department: '',
        subject: '',
        message: '',
      });
    } catch (error: unknown) {
      this.contactStatus.set(
        this.extractErrorMessage(error) || 'Online submission failed. Use the email fallback button below.',
      );
    } finally {
      this.isSubmittingContact.set(false);
    }
  }

  useEmailFallbackForAdmissions(): void {
    const payload = this.admissionsForm.getRawValue();
    const body = [
      'Admissions Inquiry',
      '',
      `Name: ${payload.fullName || ''}`,
      `Email: ${payload.email || ''}`,
      `Country: ${payload.country || ''}`,
      `Study level: ${payload.studyLevel || ''}`,
      `Preferred school: ${payload.preferredSchool || ''}`,
      `Notes: ${payload.notes || 'None'}`,
    ].join('\n');

    this.dispatchEmail(
      'Admissions Inquiry - Sankofa Alkebulan University',
      body,
      'Admissions inquiry prepared in your email client.',
    );
  }

  useEmailFallbackForContact(): void {
    const payload = this.contactForm.getRawValue();
    const body = [
      'Administrative Inquiry',
      '',
      `Name: ${payload.fullName || ''}`,
      `Email: ${payload.email || ''}`,
      `Department: ${payload.department || ''}`,
      `Subject: ${payload.subject || ''}`,
      '',
      payload.message || '',
    ].join('\n');

    this.dispatchEmail(
      'Administrative Inquiry - Sankofa Alkebulan University',
      body,
      'Inquiry prepared in your email client.',
    );
  }

  private dispatchEmail(subject: string, body: string, successMessage: string): void {
    if (typeof window === 'undefined') {
      if (subject.startsWith('Admissions')) {
        this.admissionsStatus.set('Submission is unavailable during server rendering.');
        return;
      }

      this.contactStatus.set('Submission is unavailable during server rendering.');
      return;
    }

    const mailtoLink =
      `mailto:${this.universityEmail}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoLink;

    if (subject.startsWith('Admissions')) {
      this.admissionsStatus.set(successMessage);
      return;
    }

    this.contactStatus.set(successMessage);
  }

  private extractErrorMessage(error: unknown): string | null {
    if (typeof error === 'object' && error && 'error' in error) {
      const errorData = (error as { error?: unknown }).error;
      if (
        typeof errorData === 'object' &&
        errorData &&
        'message' in errorData &&
        typeof (errorData as { message?: unknown }).message === 'string'
      ) {
        return (errorData as { message: string }).message;
      }
    }

    if (typeof error === 'object' && error && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return null;
  }
}


