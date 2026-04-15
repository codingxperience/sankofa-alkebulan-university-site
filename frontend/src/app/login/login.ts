import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  email = signal('');
  password = signal('');
  phoneNumber = signal('');
  verificationCode = signal('');
  showPhoneLogin = signal(false);
  verificationSent = signal(false);
  resendTimer = signal(0);
  isLoading = signal(false);
  error = signal('');
  verificationPending = signal(false);
  checkoutIntent = signal(false);
  returnUrl = signal('/home');

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  async ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    this.checkoutIntent.set(params.get('checkout') === '1');
    this.returnUrl.set(this.sanitizeReturnUrl(params.get('returnUrl')));

    // Handle OAuth/OTP callbacks from Supabase and exchange into backend JWT session.
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
          this.setAuthError(this.extractError(err, 'Social login failed'));
        }
      });
    } catch (err) {
      this.setAuthError(this.extractError(err, 'Failed to complete social login'));
    }
  }

  onSubmit() {
    if (!this.email() || !this.password()) {
      this.error.set('Please fill in all fields');
      return;
    }

    this.isLoading.set(true);
    this.error.set('');
    this.verificationPending.set(false);

    this.authService.login(this.email(), this.password()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigateByUrl(this.returnUrl());
      },
      error: (err) => {
        this.isLoading.set(false);
        this.setAuthError(this.extractError(err, 'Login failed'));
      }
    });
  }

  async loginWithGoogle() {
    this.isLoading.set(true);
    this.error.set('');
    this.verificationPending.set(false);
    try {
      await this.authService.signInWithOAuth('google', '/login');
    } catch (err) {
      this.isLoading.set(false);
      this.setAuthError(this.extractError(err, 'Google login failed'));
    }
  }

  async loginWithFacebook() {
    this.isLoading.set(true);
    this.error.set('');
    this.verificationPending.set(false);
    try {
      await this.authService.signInWithOAuth('facebook', '/login');
    } catch (err) {
      this.isLoading.set(false);
      this.setAuthError(this.extractError(err, 'Facebook login failed'));
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
      this.startResendTimer();
    } catch (err) {
      this.isLoading.set(false);
      this.setAuthError(this.extractError(err, 'Failed to send verification code'));
    }
  }

  startResendTimer() {
    this.resendTimer.set(60);
    const timer = setInterval(() => {
      this.resendTimer.update(current => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }

  resendVerificationCode() {
    if (this.resendTimer() > 0) return;
    this.sendVerificationCode();
  }

  async loginWithPhone() {
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
          this.router.navigateByUrl(this.returnUrl());
        },
        error: (err) => {
          this.isLoading.set(false);
          this.setAuthError(this.extractError(err, 'Phone login failed'));
        }
      });
    } catch (err) {
      this.isLoading.set(false);
      this.setAuthError(this.extractError(err, 'Phone login failed'));
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

  private sanitizeReturnUrl(value: string | null): string {
    if (!value) return '/home';
    if (!value.startsWith('/') || value.startsWith('//')) return '/home';
    return value;
  }
}
