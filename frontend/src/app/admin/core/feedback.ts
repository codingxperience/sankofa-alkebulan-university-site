import { Injectable, signal } from '@angular/core';
import { ApiError } from '../../core/api/api-client';
import type { Tone } from './vocabulary';

export interface Toast {
  readonly id: number;
  readonly text: string;
  readonly kind: 'success' | 'error';
}

/** Short confirmations after an action, and errors that have no field to sit beside. */
@Injectable({ providedIn: 'root' })
export class Toasts {
  private next = 1;
  readonly list = signal<readonly Toast[]>([]);

  success(text: string): void {
    this.push(text, 'success', 4200);
  }

  /** Accepts a sentence, or anything thrown — API errors already carry one written for people. */
  error(error: unknown): void {
    this.push(typeof error === 'string' ? error : ApiError.from(error).message, 'error', 8000);
  }

  dismiss(id: number): void {
    this.list.update((list) => list.filter((toast) => toast.id !== id));
  }

  private push(text: string, kind: Toast['kind'], ms: number): void {
    const toast: Toast = { id: this.next++, text, kind };
    // Keep the stack short: a fourth message pushes the oldest out.
    this.list.update((list) => [...list.slice(-2), toast]);
    setTimeout(() => this.dismiss(toast.id), ms);
  }
}

export interface ConfirmRequest {
  readonly title: string;
  readonly body: string;
  readonly confirm: string;
  readonly tone?: Extract<Tone, 'danger'> | 'default';
}

/** Asks before anything that cannot be taken back. Rendered once, by the console frame. */
@Injectable({ providedIn: 'root' })
export class Confirmations {
  private resolve: ((answer: boolean) => void) | null = null;
  readonly current = signal<ConfirmRequest | null>(null);

  ask(request: ConfirmRequest): Promise<boolean> {
    this.resolve?.(false);
    this.current.set(request);
    return new Promise<boolean>((resolve) => {
      this.resolve = resolve;
    });
  }

  answer(value: boolean): void {
    this.resolve?.(value);
    this.resolve = null;
    this.current.set(null);
  }
}
