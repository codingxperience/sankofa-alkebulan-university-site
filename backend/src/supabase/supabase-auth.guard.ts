import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import fetch from 'node-fetch';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const auth = req.headers['authorization'];
    if (!auth) throw new UnauthorizedException('Missing Authorization header');
    const token = String(auth).replace(/^Bearer\s+/i, '');

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !serviceKey) throw new UnauthorizedException('Supabase not configured on server');

    // Validate token by calling Supabase auth endpoint to get user info
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: serviceKey,
      },
    });
    if (!res.ok) throw new UnauthorizedException('Invalid token');
    const user = await res.json();

    // Attach supabase user to request for later use
    (req as any).supabaseUser = user;

    // Debug logging: show token user info
    console.log('[SupabaseAuthGuard] supabase user:', { email: user?.email, id: user?.id });

    // Enforce admin role: query `app_user` table for the user's email
    const email = (user && user.email) || (user && user.user_metadata && user.user_metadata.email);
    if (!email) throw new UnauthorizedException('User email not found in token');

    // Query the mapped Supabase table name for application users (`app_user`) to get role
    const restUrl = `${supabaseUrl}/rest/v1/app_user?select=id,role&email=eq.${encodeURIComponent(email)}`;
    const r = await fetch(restUrl, {
      method: 'GET',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: 'return=representation',
      },
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      console.error('[SupabaseAuthGuard] rest query failed:', r.status, txt);
      throw new ForbiddenException(`Unable to verify user role: ${r.status} ${txt}`);
    }
    const rows = await r.json();
    console.log('[SupabaseAuthGuard] app_user rows:', rows);
    const role = (rows && rows[0] && rows[0].role) || null;
    (req as any).appUser = (rows && rows[0]) || null;
    console.log('[SupabaseAuthGuard] resolved role:', role);
    if (role !== 'admin') {
      console.warn('[SupabaseAuthGuard] access denied for email:', email, 'role:', role);
      throw new ForbiddenException('Admin role required');
    }

    return true;
  }
}
