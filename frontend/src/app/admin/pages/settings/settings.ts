import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError } from '../../../core/api/api-client';
import { ConsoleApi } from '../../core/console-api';
import { ConsoleState } from '../../core/console-state';
import { Toasts } from '../../core/feedback';
import { StaffSession } from '../../core/staff-session';
import type { OfficeRoute } from '../../core/types';
import { Modal, Pill, Skeleton } from '../../ui/ui';

@Component({
  selector: 'sc-settings',
  imports: [ReactiveFormsModule, Modal, Pill, Skeleton],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  private readonly api = inject(ConsoleApi);
  private readonly toasts = inject(Toasts);
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly state = inject(ConsoleState);
  protected readonly session = inject(StaffSession);

  protected readonly canManage = computed(() => this.session.can('settings.manage'));
  protected readonly editing = signal<OfficeRoute | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly loading = signal(true);

  protected readonly form = this.fb.group({
    label: ['', [Validators.required, Validators.minLength(2)]],
    responseTarget: ['', [Validators.required, Validators.minLength(2)]],
    notifyEmails: ['', Validators.required],
  });

  constructor() {
    Promise.allSettled([this.state.loadOffices(), this.state.loadSystem()]).finally(() => this.loading.set(false));
  }

  protected edit(route: OfficeRoute): void {
    this.form.reset({ label: route.label, responseTarget: route.responseTarget, notifyEmails: route.notifyEmails.join('\n') });
    this.error.set('');
    this.editing.set(route);
  }

  protected async save(): Promise<void> {
    const route = this.editing();
    if (!route) {
      return;
    }
    const value = this.form.getRawValue();
    const notifyEmails = value.notifyEmails
      .split(/[\s,;]+/)
      .map((address) => address.trim())
      .filter(Boolean);
    if (this.form.invalid || notifyEmails.length === 0) {
      this.error.set('A name, a reply time and at least one address to notify are needed.');
      return;
    }
    this.saving.set(true);
    try {
      await this.api.put<OfficeRoute>(`/settings/offices/${route.office}`, {
        label: value.label,
        responseTarget: value.responseTarget,
        notifyEmails,
      });
      await this.state.loadOffices();
      this.editing.set(null);
      this.toasts.success(`${value.label} saved.`);
    } catch (error) {
      const failure = ApiError.from(error);
      this.error.set(Object.values(failure.fields)[0] ?? failure.message);
    } finally {
      this.saving.set(false);
    }
  }
}
