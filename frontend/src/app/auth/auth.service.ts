import { getSupabaseClient } from '../core/supabase-client';

export class AuthService {
  private supabase = getSupabaseClient();

  async signUpWithPassword(email: string, password: string) {
    const resp = await this.supabase.auth.signUp({ email, password });
    if (resp.error) throw resp.error;
    return resp.data;
  }

  async signInWithPassword(email: string, password: string) {
    const resp = await this.supabase.auth.signInWithPassword({ email, password });
    if (resp.error) throw resp.error;
    if (resp.data?.session) {
      localStorage.setItem('sb_session', JSON.stringify(resp.data.session));
    }
    return resp.data;
  }

  async login(email: string, password: string) {
    return this.signInWithPassword(email, password);
  }

  async logout() {
    localStorage.removeItem('sb_session');
    return this.supabase.auth.signOut();
  }

  getSession() {
    const s = localStorage.getItem('sb_session');
    return s ? JSON.parse(s) : null;
  }

  // OAuth sign-in: redirect flow
  async signInWithProvider(provider: 'google' | 'facebook') {
    return this.supabase.auth.signInWithOAuth({ provider });
  }

  // Phone OTP (Supabase supports SMS OTP)
  async sendPhoneOtp(phone: string) {
    const resp = await this.supabase.auth.signInWithOtp({ phone });
    if (resp.error) throw resp.error;
    return resp.data;
  }

  // Verify phone by exchanging magic link/OTP is handled via Supabase redirect; for server-side verification, use backend endpoints.
  async getUser() {
    const r = await this.supabase.auth.getUser();
    if (r.error) throw r.error;
    return r.data.user;
  }
}

export const authService = new AuthService();
