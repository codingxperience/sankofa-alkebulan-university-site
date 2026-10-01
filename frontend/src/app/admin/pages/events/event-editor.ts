import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiError } from '../../../core/api/api-client';
import { ConsoleApi } from '../../core/console-api';
import { Toasts } from '../../core/feedback';
import type { EventDetail, EventStatus } from '../../core/types';
import { fromZonedInput, timeZones, toZonedInput } from '../../core/zones';
import { Skeleton } from '../../ui/ui';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const lines = (text: string) =>
  [...new Set(text.split('\n').map((line) => line.trim()).filter(Boolean))];

@Component({
  selector: 'sc-event-editor',
  imports: [ReactiveFormsModule, RouterLink, Skeleton],
  templateUrl: './event-editor.html',
  styles: `
    .ee-error {
      margin-right: auto;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventEditorPage {
  private readonly api = inject(ConsoleApi);
  private readonly toasts = inject(Toasts);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  protected readonly zones = timeZones();
  protected readonly loading = signal(Boolean(this.id));
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly fields = signal<Record<string, string>>({});
  protected readonly original = signal<EventDetail | null>(null);
  private slugEdited = Boolean(this.id);

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    slug: ['', [Validators.required, Validators.pattern(SLUG)]],
    summary: [''],
    venue: [''],
    timezone: ['Africa/Kampala', Validators.required],
    startsAt: ['', Validators.required],
    endsAt: [''],
    registrationClosesAt: [''],
    capacity: [''],
    status: ['DRAFT' as EventStatus],
    attendeeCategories: [''],
    attendanceModes: [''],
    days: [''],
    interests: [''],
  });

  protected readonly heading = computed(() => (this.id ? `Edit ${this.original()?.title ?? 'event'}` : 'New event'));

  constructor() {
    if (this.id) {
      void this.load(this.id);
    }
    this.form.controls.title.valueChanges.subscribe((title) => {
      if (!this.slugEdited) {
        this.form.controls.slug.setValue(slugify(title), { emitEvent: false });
      }
    });
  }

  protected slugTyped(): void {
    this.slugEdited = true;
  }

  protected async save(): Promise<void> {
    this.error.set('');
    this.fields.set({});
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('A title, a web address and a start time are needed.');
      return;
    }
    const v = this.form.getRawValue();
    const zone = v.timezone;
    const capacityText = String(v.capacity ?? '').trim();
    const capacity = capacityText === '' ? null : Number(capacityText);
    if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) {
      this.fields.set({ capacity: 'Use a whole number, or leave it empty for no limit.' });
      return;
    }
    const body = {
      title: v.title,
      slug: v.slug,
      summary: v.summary,
      venue: v.venue,
      timezone: zone,
      startsAt: fromZonedInput(v.startsAt, zone),
      endsAt: v.endsAt ? fromZonedInput(v.endsAt, zone) : null,
      registrationClosesAt: v.registrationClosesAt ? fromZonedInput(v.registrationClosesAt, zone) : null,
      capacity,
      status: v.status,
      options: {
        attendeeCategories: lines(v.attendeeCategories),
        attendanceModes: lines(v.attendanceModes),
        days: lines(v.days),
        interests: lines(v.interests),
      },
    };
    this.saving.set(true);
    try {
      const saved = this.id
        ? await this.api.patch<EventDetail>(`/events/${this.id}`, body)
        : await this.api.post<EventDetail>('/events', body);
      this.toasts.success(this.id ? 'Event saved.' : 'Event created.');
      await this.router.navigate(['/admin/events', saved.id]);
    } catch (error) {
      const failure = ApiError.from(error);
      this.error.set(failure.message);
      this.fields.set(failure.fields);
    } finally {
      this.saving.set(false);
    }
  }

  private async load(id: string): Promise<void> {
    try {
      const event = await this.api.get<EventDetail>(`/events/${id}`);
      this.original.set(event);
      const zone = event.timezone;
      this.form.setValue(
        {
          title: event.title,
          slug: event.slug,
          summary: event.summary ?? '',
          venue: event.venue ?? '',
          timezone: zone,
          startsAt: toZonedInput(event.startsAt, zone),
          endsAt: toZonedInput(event.endsAt, zone),
          registrationClosesAt: toZonedInput(event.registrationClosesAt, zone),
          capacity: event.capacity === null ? '' : String(event.capacity),
          status: event.status,
          attendeeCategories: event.options.attendeeCategories.join('\n'),
          attendanceModes: event.options.attendanceModes.join('\n'),
          days: event.options.days.join('\n'),
          interests: event.options.interests.join('\n'),
        },
        { emitEvent: false },
      );
    } catch (error) {
      this.error.set(ApiError.from(error).message);
    } finally {
      this.loading.set(false);
    }
  }
}
