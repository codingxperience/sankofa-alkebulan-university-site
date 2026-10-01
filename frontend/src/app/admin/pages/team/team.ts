import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError } from '../../../core/api/api-client';
import { ConsoleApi } from '../../core/console-api';
import { ConsoleState } from '../../core/console-state';
import { Confirmations, Toasts } from '../../core/feedback';
import { AgoPipe, InitialsPipe, WhenPipe } from '../../core/format';
import { StaffSession } from '../../core/staff-session';
import type { IssuedLink, Office, StaffMember, StaffRole } from '../../core/types';
import { OFFICE_ORDER, ROLES, STAFF_STATUS } from '../../core/vocabulary';
import { CopyLink, Modal, Pill, Skeleton } from '../../ui/ui';

const PRIVILEGED: readonly StaffRole[] = ['OWNER', 'ADMIN'];

interface LinkResult {
  readonly name: string;
  readonly kind: 'invitation' | 'reset';
  readonly link: IssuedLink;
  readonly emailQueued: boolean;
}

@Component({
  selector: 'sc-team',
  imports: [ReactiveFormsModule, Pill, Skeleton, Modal, CopyLink, AgoPipe, InitialsPipe, WhenPipe],
  templateUrl: './team.html',
  styleUrl: './team.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamPage {
  private readonly api = inject(ConsoleApi);
  private readonly toasts = inject(Toasts);
  private readonly confirmations = inject(Confirmations);
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly state = inject(ConsoleState);
  protected readonly session = inject(StaffSession);

  protected readonly roles = ROLES;
  protected readonly offices = OFFICE_ORDER;
  protected readonly statusTerms = STAFF_STATUS;

  protected readonly members = signal<readonly StaffMember[]>([]);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly fields = signal<Record<string, string>>({});

  protected readonly inviting = signal(false);
  protected readonly editing = signal<StaffMember | null>(null);
  protected readonly result = signal<LinkResult | null>(null);

  protected readonly canManage = computed(() => this.session.can('staff.manage'));
  protected readonly isOwner = computed(() => this.session.me()?.roles.includes('OWNER') ?? false);
  protected readonly editingSelf = computed(() => this.editing()?.id === this.session.me()?.id);
  /** Administrator and owner accounts can only be changed by an owner (or, partly, by themselves). */
  protected readonly protectedMember = computed(() => {
    const member = this.editing();
    return !!member && !this.editingSelf() && !this.isOwner() && member.roles.some((role) => PRIVILEGED.includes(role));
  });

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    title: [''],
  });
  protected readonly chosenRoles = signal<ReadonlySet<StaffRole>>(new Set());
  protected readonly chosenOffices = signal<ReadonlySet<Office>>(new Set());

  constructor() {
    void this.load();
    void this.state.loadOffices().catch(() => undefined);
  }

  /** Only owners may give or take the Owner and Administrator roles; nobody changes their own. */
  protected roleLocked(role: StaffRole): boolean {
    return (PRIVILEGED.includes(role) && !this.isOwner()) || this.editingSelf();
  }

  protected toggleRole(role: StaffRole): void {
    this.chosenRoles.update((set) => {
      const next = new Set(set);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }

  protected toggleOffice(office: Office): void {
    this.chosenOffices.update((set) => {
      const next = new Set(set);
      if (next.has(office)) next.delete(office);
      else next.add(office);
      return next;
    });
  }

  protected startInvite(): void {
    this.form.reset({ name: '', email: '', title: '' });
    this.form.controls.email.enable();
    this.chosenRoles.set(new Set());
    this.chosenOffices.set(new Set());
    this.error.set('');
    this.fields.set({});
    this.editing.set(null);
    this.inviting.set(true);
  }

  protected startEdit(member: StaffMember): void {
    this.form.reset({ name: member.name, email: member.email, title: member.title ?? '' });
    this.form.controls.email.disable();
    this.chosenRoles.set(new Set(member.roles));
    this.chosenOffices.set(new Set(member.offices));
    this.error.set('');
    this.fields.set({});
    this.inviting.set(false);
    this.editing.set(member);
  }

  protected closeForm(): void {
    this.inviting.set(false);
    this.editing.set(null);
  }

  protected async submit(): Promise<void> {
    this.error.set('');
    this.fields.set({});
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('A name and a valid email address are needed.');
      return;
    }
    const roles = [...this.chosenRoles()];
    if (roles.length === 0) {
      this.error.set('Choose at least one role.');
      return;
    }
    const value = this.form.getRawValue();
    const editing = this.editing();
    const self = this.editingSelf();
    this.busy.set(true);
    try {
      if (editing) {
        const body: Record<string, unknown> = { name: value.name, title: value.title, offices: [...this.chosenOffices()] };
        if (!self) {
          body['roles'] = roles;
        }
        const updated = await this.api.patch<StaffMember>(`/staff/${editing.id}`, body);
        this.replace(updated);
        this.toasts.success(`${updated.name} updated.`);
        this.closeForm();
        if (self) {
          await this.session.refresh();
        }
      } else {
        const invited = await this.api.post<{ member: StaffMember; link: IssuedLink; emailQueued: boolean }>('/staff', {
          name: value.name,
          email: value.email.trim(),
          title: value.title,
          roles,
          offices: [...this.chosenOffices()],
        });
        this.members.update((list) => [...list, invited.member].sort((a, b) => a.name.localeCompare(b.name)));
        this.closeForm();
        this.result.set({ name: invited.member.name, kind: 'invitation', link: invited.link, emailQueued: invited.emailQueued });
      }
    } catch (error) {
      const failure = ApiError.from(error);
      this.error.set(failure.message);
      this.fields.set(failure.fields);
    } finally {
      this.busy.set(false);
    }
  }

  protected async setStatus(member: StaffMember, status: 'ACTIVE' | 'SUSPENDED'): Promise<void> {
    if (status === 'SUSPENDED') {
      const yes = await this.confirmations.ask({
        title: `Suspend ${member.name}?`,
        body: 'They are signed out everywhere at once and cannot sign in until reactivated. Their work and history stay as they are.',
        confirm: 'Suspend',
        tone: 'danger',
      });
      if (!yes) {
        return;
      }
    }
    this.busy.set(true);
    try {
      const updated = await this.api.patch<StaffMember>(`/staff/${member.id}`, { status });
      this.replace(updated);
      this.editing.set(null);
      this.toasts.success(status === 'SUSPENDED' ? `${member.name} is suspended.` : `${member.name} can sign in again.`);
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.busy.set(false);
    }
  }

  protected async sendLink(member: StaffMember): Promise<void> {
    const invitation = member.status === 'INVITED';
    const yes = await this.confirmations.ask({
      title: invitation ? `Send ${member.name} a new invitation?` : `Send ${member.name} a sign-in link?`,
      body: invitation
        ? 'Earlier invitation links stop working. The new one lasts seven days.'
        : 'They will choose a new password with it. The link lasts 24 hours, and any earlier reset link stops working.',
      confirm: invitation ? 'Send invitation' : 'Send link',
    });
    if (!yes) {
      return;
    }
    this.busy.set(true);
    try {
      const issued = await this.api.post<{ link: IssuedLink; kind: 'invitation' | 'reset'; emailQueued: boolean }>(`/staff/${member.id}/access-link`);
      this.editing.set(null);
      this.result.set({ name: member.name, ...issued });
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.busy.set(false);
    }
  }

  private replace(member: StaffMember): void {
    this.members.update((list) => list.map((item) => (item.id === member.id ? member : item)));
  }

  private async load(): Promise<void> {
    try {
      this.members.set(await this.api.get<StaffMember[]>('/staff'));
    } catch (error) {
      this.toasts.error(error);
    } finally {
      this.loading.set(false);
    }
  }
}
