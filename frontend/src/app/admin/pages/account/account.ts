import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError } from '../../../core/api/api-client';
import { ConsoleApi } from '../../core/console-api';
import { ConsoleState } from '../../core/console-state';
import { Confirmations, Toasts } from '../../core/feedback';
import { AgoPipe, WhenPipe } from '../../core/format';
import { StaffSession } from '../../core/staff-session';
import type { Me, StaffSessionRecord } from '../../core/types';
import { Skeleton } from '../../ui/ui';

/** "Chrome on macOS" from a user-agent string — enough to recognise your own devices. */
function describeDevice(userAgent: string | null): string {
  if (!userAgent) {
    return 'Unknown device';
  }
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /OPR\//.test(userAgent)
      ? 'Opera'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Chrome\//.test(userAgent)
          ? 'Chrome'
          : /Safari\//.test(userAgent)
            ? 'Safari'
            : 'A browser';
  const system = /iPhone|iPad/.test(userAgent)
    ? 'iOS'
    : /Android/.test(userAgent)
      ? 'Android'
      : /Mac OS X/.test(userAgent)
        ? 'macOS'
        : /Windows/.test(userAgent)
          ? 'Windows'
          : /CrOS/.test(userAgent)
            ? 'ChromeOS'
            : /Linux/.test(userAgent)
              ? 'Linux'
              : 'an unknown system';
  return `${browser} on ${system}`;
}

@Component({
  selector: 'sc-account',
  imports: [ReactiveFormsModule, Skeleton, AgoPipe, WhenPipe],
  templateUrl: './account.html',
  styleUrl: './account.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountPage {
  private readonly api = inject(ConsoleApi);
  private readonly toasts = inject(Toasts);
  private readonly confirmations = inject(Confirmations);
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly state = inject(ConsoleState);
  protected readonly session = inject(StaffSession);

  protected readonly sessions = signal<readonly StaffSessionRecord[]>([]);
  protected readonly loadingSessions = signal(true);
  protected readonly savingProfile = signal(false);
  protected readonly savingPassword = signal(false);
  protected readonly passwordError = signal('');
  protected readonly passwordFields = signal<Record<string, string>>({});

  protected readonly permissionCount = computed(() => this.session.me()?.permissions.length ?? 0);

  protected readonly profile = this.fb.group({
    name: [this.session.me()?.name ?? '', [Validators.required, Validators.minLength(2)]],
    title: [this.session.me()?.title ?? ''],
  });

  protected readonly password = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(12)]],
    confirm: ['', Validators.required],
  });

  constructor() {
    void this.loadSessions();
  }

  protected device(record: StaffSessionRecord): string {
    return describeDevice(record.userAgent);
  }

  protected async saveProfile(): Promise<void> {
    if (this.profile.invalid) {
      this.toasts.error('Your name needs at least two characters.');
      return;
    }
    this.savingProfile.set(true);
    try {
      const me = await this.api.patch<Me>('/auth/me', this.profile.getRawValue());
      this.session.me.set(me);
      this.profile.markAsPristine();
      this.toasts.success('Profile saved.');
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.savingProfile.set(false);
    }
  }

  protected async changePassword(): Promise<void> {
    this.passwordError.set('');
    this.passwordFields.set({});
    const value = this.password.getRawValue();
    if (!value.currentPassword || value.newPassword.length < 12) {
      this.passwordError.set('Enter your current password and a new one of at least 12 characters.');
      return;
    }
    if (value.newPassword !== value.confirm) {
      this.passwordFields.set({ confirm: 'The two new passwords are different.' });
      return;
    }
    this.savingPassword.set(true);
    try {
      await this.api.post('/auth/password', { currentPassword: value.currentPassword, newPassword: value.newPassword });
      this.password.reset();
      this.toasts.success('Password changed. Every other device has been signed out.');
      void this.loadSessions();
    } catch (error) {
      const failure = ApiError.from(error);
      const fields = { ...failure.fields };
      if (fields['password']) {
        fields['newPassword'] = fields['password'];
      }
      this.passwordFields.set(fields);
      if (!fields['currentPassword'] && !fields['newPassword']) {
        this.passwordError.set(failure.message);
      }
    } finally {
      this.savingPassword.set(false);
    }
  }

  protected async signOutDevice(record: StaffSessionRecord): Promise<void> {
    const yes = await this.confirmations.ask({
      title: 'Sign out this device?',
      body: `${this.device(record)}, last active ${new Date(record.lastSeenAt).toLocaleString('en-GB')}. Whoever is using it will need to sign in again.`,
      confirm: 'Sign it out',
    });
    if (!yes) {
      return;
    }
    try {
      await this.api.delete(`/auth/sessions/${record.id}`);
      this.sessions.update((list) => list.filter((item) => item.id !== record.id));
      this.toasts.success('Device signed out.');
    } catch (error) {
      this.toasts.error(error);
    }
  }

  private async loadSessions(): Promise<void> {
    try {
      this.sessions.set(await this.api.get<StaffSessionRecord[]>('/auth/sessions'));
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.loadingSessions.set(false);
    }
  }
}
