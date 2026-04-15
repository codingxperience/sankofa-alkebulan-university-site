import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { authService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-card">
      <h2>Sign in</h2>
      <form (submit)="onSubmit($event)">
        <input type="email" placeholder="Email" [(ngModel)]="email" name="email" required />
        <input type="password" placeholder="Password" [(ngModel)]="password" name="password" required />
        <button class="btn btn--primary" type="submit">Sign in</button>
      </form>
      <p *ngIf="error" class="error">{{ error }}</p>
    </div>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  error: string | null = null;
  constructor(private router: Router) {}

  async onSubmit(e: Event) {
    e.preventDefault();
    try {
      await authService.login(this.email, this.password);
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error = err.message || 'Sign-in failed';
    }
  }
}
