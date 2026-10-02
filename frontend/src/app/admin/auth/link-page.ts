import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiClient, ApiError } from '../../core/api/api-client';
import { ConsoleState } from '../core/console-state';
import { Toasts } from '../core/feedback';
import { StaffSession } from '../core/staff-session';
import { Skeleton } from '../ui/ui';
import { AuthFrame } from './auth-frame';

type Purpose = 'invitation' | 'reset';

const COPY: Record<Purpose, { inspect: string; redeem: string; heading: string; done: string }> = {
  invitation: {
    inspect: '/admin/auth/invitation/inspect',
    redeem: '/admin/auth/invitation/accept',
    heading: 'Join the console',
    done: 'Welcome. Your account is ready.',
  },
  reset: {
    inspect: '/admin/auth/password-reset/inspect',
    redeem: '/admin/auth/password-reset/complete',
    heading: 'Choose a new password',
    done: 'Your password has been changed.',
  },
};

/**
 * Where invitation and password-reset emails lead. The token travels in the
 * URL fragment, which browsers never send to a server; it is read once, then
 * removed from the address bar and history.
 */
@Component({
  selector: 'sc-link-page',
  imports: [ReactiveFormsModule, RouterLink, AuthFrame, Skeleton],
  templateUrl: './link-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkPage {
  private readonly api = inject(ApiClient);
  private readonly session = inject(StaffSession);
  private readonly state = inject(ConsoleState);
  private readonly toasts = inject(Toasts);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly purpose: Purpose = inject(ActivatedRoute).snapshot.data['purpose'] === 'reset' ? 'reset' : 'invitation';
  protected readonly copy = COPY[this.purpose];
  private readonly token = this.takeToken();

  protected readonly phase = signal<'checking' | 'ready' | 'invalid'>(this.token ? 'checking' : 'invalid');
  protected readonly person = signal<{ name: string; email: string } | null>(null);
  protected readonly problem = signal(
    this.token ? '' : 'This page needs the link from your email. Open it again from the message — links only work once.',
  );
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly showPassword = signal(false);
  protected readonly firstName = computed(() => this.person()?.name.split(/\s+/)[0] ?? '');

  protected readonly form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(12)]],
    confirm: ['', Validators.required],
  });

  constructor() {
    if (this.token) {
      this.api
        .post<{ name: string; email: string }>(this.copy.inspect, { token: this.token })
        .then((person) => {
          this.person.set(person);
          this.phase.set('ready');
        })
        .catch((error: unknown) => {
          this.problem.set(ApiError.from(error).message);
          this.phase.set('invalid');
        });
    }
  }

  protected async submit(): Promise<void> {
    const { password, confirm } = this.form.getRawValue();
    if (password.length < 12) {
      this.error.set('Use at least 12 characters. A short phrase of four or five words works well.');
      return;
    }
    if (password !== confirm) {
      this.error.set('The two passwords are different. Type the same password in both boxes.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.post(this.copy.redeem, { token: this.token, password });
      await this.session.refresh();
      this.state.reset();
      this.toasts.success(this.copy.done);
      await this.router.navigateByUrl('/admin');
    } catch (error) {
      const failure = ApiError.from(error);
      if (failure.status === 410 || failure.status === 404) {
        this.problem.set(failure.message);
        this.phase.set('invalid');
      } else {
        this.error.set(failure.fields['password'] ?? failure.message);
      }
    } finally {
      this.busy.set(false);
    }
  }

  private takeToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
    if (token) {
      window.history.replaceState(window.history.state, '', window.location.pathname);
    }
    return token && /^[A-Za-z0-9_-]{20,100}$/.test(token) ? token : null;
  }
}
