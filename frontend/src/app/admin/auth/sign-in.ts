import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiClient, ApiError } from '../../core/api/api-client';
import { ConsoleState } from '../core/console-state';
import { StaffSession } from '../core/staff-session';
import { AuthFrame } from './auth-frame';

type Mode = 'sign-in' | 'invited' | 'setup' | 'forgot' | 'forgot-sent';

/** Only places inside the console are valid destinations after signing in. */
function safeNext(value: string | null): string {
  return value && value.startsWith('/admin') && !value.startsWith('//') ? value : '/admin';
}

@Component({
  selector: 'sc-sign-in',
  imports: [ReactiveFormsModule, AuthFrame],
  templateUrl: './sign-in.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignIn {
  private readonly api = inject(ApiClient);
  private readonly session = inject(StaffSession);
  private readonly state = inject(ConsoleState);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly injector = inject(Injector);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');

  protected readonly mode = signal<Mode>('sign-in');
  protected readonly setupAvailable = signal(false);
  /** No account exists yet and the server has no ADMIN_SETUP_KEY to create one with. */
  protected readonly awaitingSetupKey = signal(false);
  /** The console's server could not be reached, so signing in cannot work either. */
  protected readonly unreachable = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly fields = signal<Record<string, string>>({});
  protected readonly showPassword = signal(false);
  protected readonly ended = this.route.snapshot.queryParamMap.has('ended');
  /** Where someone without an account asks for one: the university administration. */
  protected readonly accountRequest = 'mailto:SanAlkeU@outlook.com?subject=Sankofa%20console%20account';

  protected readonly signInForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly setupForm = this.fb.group({
    setupKey: ['', Validators.required],
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(12)]],
  });

  protected readonly forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    this.api
      .get<{ setupAvailable: boolean; awaitingSetupKey: boolean }>('/admin/auth/state')
      .then((state) => {
        this.setupAvailable.set(state.setupAvailable);
        this.awaitingSetupKey.set(state.awaitingSetupKey);
        if (state.setupAvailable) {
          this.switchTo('setup');
        }
      })
      .catch((error: unknown) => {
        const failure = ApiError.from(error);
        this.unreachable.set(
          failure.status === 0 ? failure.message : 'The console’s server is not responding properly, so signing in will not work yet.',
        );
      });
  }

  protected switchTo(mode: Mode): void {
    this.mode.set(mode);
    this.error.set('');
    this.fields.set({});
    // The control that was pressed has gone with the old view; start keyboard users at the new heading.
    afterNextRender(() => this.heading()?.nativeElement.focus(), { injector: this.injector });
    if (mode === 'forgot' && this.signInForm.controls.email.value) {
      this.forgotForm.controls.email.setValue(this.signInForm.controls.email.value);
    }
  }

  protected async signIn(): Promise<void> {
    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      this.error.set('Enter your email address and password.');
      return;
    }
    const { email, password } = this.signInForm.getRawValue();
    await this.run(async () => {
      await this.session.signIn(email.trim(), password);
      this.state.reset();
      await this.router.navigateByUrl(safeNext(this.route.snapshot.queryParamMap.get('next')));
    });
    this.signInForm.controls.password.reset();
  }

  protected async setUp(): Promise<void> {
    if (this.setupForm.invalid) {
      this.setupForm.markAllAsTouched();
      this.error.set('Fill in every field. The password needs at least 12 characters.');
      return;
    }
    const body = this.setupForm.getRawValue();
    await this.run(async () => {
      await this.api.post('/admin/auth/setup', { ...body, email: body.email.trim() });
      await this.session.refresh();
      this.state.reset();
      await this.router.navigateByUrl('/admin');
    });
  }

  protected async requestReset(): Promise<void> {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      this.error.set('Enter the email address you sign in with.');
      return;
    }
    await this.run(async () => {
      await this.api.post('/admin/auth/password-reset/request', { email: this.forgotForm.getRawValue().email.trim() });
      this.mode.set('forgot-sent');
    });
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    this.fields.set({});
    try {
      await action();
    } catch (error) {
      const failure = ApiError.from(error);
      this.error.set(failure.message);
      this.fields.set(failure.fields);
    } finally {
      this.busy.set(false);
    }
  }
}
