import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit {
  name = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  phoneNumber = signal('');
  verificationCode = signal('');
  showPhoneRegister = signal(false);
  verificationSent = signal(false);
  isLoading = signal(false);
  error = signal('');
  success = signal('');
  verificationPending = signal(false);
  checkoutIntent = signal(false);
  returnUrl = signal('/home');
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  async ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    this.checkoutIntent.set(params.get('checkout') === '1');
    this.returnUrl.set(this.sanitizeReturnUrl(params.get('returnUrl')));

    // If OAuth callback lands on register route, exchange and continue.
    if (this.authService.isAuthenticated) {
      this.router.navigateByUrl(this.returnUrl());
      return;
    }

    try {
      const accessToken = await this.authService.getSupabaseAccessToken();
      if (!accessToken) return;

      this.isLoading.set(true);
      this.authService.exchangeSupabaseSession(accessToken).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigateByUrl(this.returnUrl());
        },
        error: (err) => {
          this.isLoading.set(false);
          this.setAuthError(this.extractError(err, 'Social registration failed'));
        }
      });
    } catch (err) {
      this.setAuthError(this.extractError(err, 'Failed to complete social registration'));
    }
  }

  onSubmit() {
    if (!this.name() || !this.email() || !this.password() || !this.confirmPassword()) {
      this.error.set('Please fill in all fields');
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.error.set('Passwords do not match');
      return;
    }

    if (this.passwordStrengthScore() < 4) {
      this.error.set('Use a stronger password. Meet at least 4 security checks.');
      return;
    }

    this.isLoading.set(true);
    this.error.set('');
    this.verificationPending.set(false);
    this.success.set('');

    this.authService.register(this.email(), this.password(), this.name()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.success.set('Registration successful! Redirecting...');
        setTimeout(() => {
          this.router.navigateByUrl(this.returnUrl());
        }, 1200);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(this.extractError(err, 'Registration failed'));
      }
    });
  }

  async registerWithGoogle() {
    this.isLoading.set(true);
    this.error.set('');
    this.verificationPending.set(false);

    try {
      await this.authService.signInWithOAuth('google', '/register');
    } catch (err) {
      this.isLoading.set(false);
      this.setAuthError(this.extractError(err, 'Google registration failed'));
    }
  }

  async registerWithFacebook() {
    this.isLoading.set(true);
    this.error.set('');
    this.verificationPending.set(false);

    try {
      await this.authService.signInWithOAuth('facebook', '/register');
    } catch (err) {
      this.isLoading.set(false);
      this.setAuthError(this.extractError(err, 'Facebook registration failed'));
    }
  }

  async sendVerificationCode() {
    if (!this.phoneNumber()) {
      this.error.set('Please enter your phone number');
      return;
    }

    this.isLoading.set(true);
    this.error.set('');
    this.verificationPending.set(false);

    try {
      await this.authService.sendPhoneOtp(this.phoneNumber());
      this.isLoading.set(false);
      this.verificationSent.set(true);
    } catch (err) {
      this.isLoading.set(false);
      this.setAuthError(this.extractError(err, 'Failed to send verification code'));
    }
  }

  async registerWithPhone() {
    if (!this.phoneNumber() || !this.verificationCode()) {
      this.error.set('Please enter both phone number and verification code');
      return;
    }

    this.isLoading.set(true);
    this.error.set('');
    this.verificationPending.set(false);

    try {
      const accessToken = await this.authService.verifyPhoneOtp(
        this.phoneNumber(),
        this.verificationCode(),
      );

      this.authService.exchangeSupabaseSession(accessToken).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.success.set('Registration successful! Redirecting...');
          setTimeout(() => {
            this.router.navigateByUrl(this.returnUrl());
          }, 1200);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.setAuthError(this.extractError(err, 'Phone registration failed'));
        }
      });
    } catch (err) {
      this.isLoading.set(false);
      this.setAuthError(this.extractError(err, 'Phone registration failed'));
    }
  }

  private extractError(err: any, fallback: string): string {
    if (typeof err === 'string') return err;
    return err?.error?.message || err?.message || fallback;
  }

  private setAuthError(message: string) {
    this.error.set(message);
    this.verificationPending.set(message.toLowerCase().includes('pending verification'));
  }

  passwordChecks() {
    const value = this.password();
    return {
      length: value.length >= 12,
      upper: /[A-Z]/.test(value),
      lower: /[a-z]/.test(value),
      number: /[0-9]/.test(value),
      symbol: /[^A-Za-z0-9]/.test(value),
    };
  }

  passwordStrengthScore(): number {
    const checks = this.passwordChecks();
    return Object.values(checks).filter(Boolean).length;
  }

  passwordStrengthLabel(): string {
    const score = this.passwordStrengthScore();
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Strong';
    return 'Excellent';
  }

  passwordStrengthClass(): string {
    const score = this.passwordStrengthScore();
    if (score <= 2) return 'weak';
    if (score <= 3) return 'fair';
    if (score <= 4) return 'strong';
    return 'excellent';
  }

  generateSecurePassword() {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '@#$%&*+-_=!?';
    const all = upper + lower + numbers + symbols;

    const chars = [
      upper[Math.floor(Math.random() * upper.length)],
      lower[Math.floor(Math.random() * lower.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];

    for (let i = chars.length; i < 16; i += 1) {
      chars.push(all[Math.floor(Math.random() * all.length)]);
    }

    for (let i = chars.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    const generated = chars.join('');
    this.password.set(generated);
    this.confirmPassword.set(generated);
  }

  togglePassword() {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPassword() {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  private sanitizeReturnUrl(value: string | null): string {
    if (!value) return '/home';
    if (!value.startsWith('/') || value.startsWith('//')) return '/home';
    return value;
  }
}
