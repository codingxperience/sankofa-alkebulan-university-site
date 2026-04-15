import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.scss',
  animations: [
    trigger('fadeInOut', [
      state('in', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('void => *', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms cubic-bezier(0.4, 0, 0.2, 1)')
      ]),
      transition('* => void', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ]),
    trigger('shake', [
      transition('* => shake', [
        animate('300ms', style({ transform: 'translateX(-10px)' })),
        animate('300ms', style({ transform: 'translateX(10px)' })),
        animate('300ms', style({ transform: 'translateX(-10px)' })),
        animate('300ms', style({ transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class AdminLogin implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Form state
  email = signal('');
  password = signal('');
  rememberMe = signal(false);

  // UI state
  isLoading = signal(false);
  showPassword = signal(false);
  loginAttempts = signal(0);
  isLocked = signal(false);
  lockoutTime = signal(0);
  shakeState = signal<'normal' | 'shake'>('normal');
  error = signal('');

  // Security
  maxAttempts = 3;
  private lockoutDuration = 5 * 60; // 5 minutes in seconds
  private lockoutTimer?: NodeJS.Timeout;

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  ngOnInit() {
    // Only run browser-specific code on the client side
    if (this.isBrowser()) {
      // Check if already logged in as admin
      if (this.authService.isAuthenticated && this.authService.isAdmin) {
        this.router.navigate(['/admin']);
        return;
      }

      // Check for lockout
      const lockoutExpiry = localStorage.getItem('admin_lockout_expiry');
      if (lockoutExpiry) {
        const expiry = parseInt(lockoutExpiry);
        const now = Date.now();
        if (now < expiry) {
          this.isLocked.set(true);
          this.lockoutTime.set(Math.ceil((expiry - now) / 1000));
          this.startLockoutTimer();
        }
      }
    }
  }

  ngOnDestroy() {
    if (this.lockoutTimer) {
      clearInterval(this.lockoutTimer);
    }
  }

  async onSubmit() {
    if (this.isLocked() || this.isLoading()) return;

    // Validate form
    if (!this.email().trim() || !this.password().trim()) {
      this.triggerShake();
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email())) {
      this.triggerShake();
      return;
    }

    this.isLoading.set(true);
    this.shakeState.set('normal');
    this.error.set('');

    try {
      await firstValueFrom(this.authService.adminLogin(this.email(), this.password()));

      // Success - reset attempts and navigate
      this.loginAttempts.set(0);
      localStorage.removeItem('admin_lockout_expiry');

      // Store remember me preference
      if (this.rememberMe()) {
        localStorage.setItem('admin_remember', 'true');
      }

      this.router.navigate(['/admin']);

    } catch (error: any) {
      this.loginAttempts.set(this.loginAttempts() + 1);
      this.error.set(
        (typeof error === 'string' ? error : error?.error?.message || error?.message) ||
          'Login failed. Please check your credentials.',
      );

      if (this.loginAttempts() >= this.maxAttempts) {
        this.activateLockout();
      } else {
        this.triggerShake();
      }

      this.isLoading.set(false);
    }
  }

  private triggerShake() {
    this.shakeState.set('shake');
    setTimeout(() => this.shakeState.set('normal'), 600);
  }

  private activateLockout() {
    this.isLocked.set(true);
    const lockoutExpiry = Date.now() + (this.lockoutDuration * 1000);
    localStorage.setItem('admin_lockout_expiry', lockoutExpiry.toString());
    this.lockoutTime.set(this.lockoutDuration);
    this.startLockoutTimer();
  }

  private startLockoutTimer() {
    this.lockoutTimer = setInterval(() => {
      this.lockoutTime.set(this.lockoutTime() - 1);

      if (this.lockoutTime() <= 0) {
        this.isLocked.set(false);
        this.loginAttempts.set(0);
        localStorage.removeItem('admin_lockout_expiry');
        if (this.lockoutTimer) {
          clearInterval(this.lockoutTimer);
        }
      }
    }, 1000);
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  formatLockoutTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Security features
  onEmailInput() {
    // Clear any previous shake animation
    if (this.shakeState() === 'shake') {
      this.shakeState.set('normal');
    }
  }

  onPasswordInput() {
    // Clear any previous shake animation
    if (this.shakeState() === 'shake') {
      this.shakeState.set('normal');
    }
  }
}
