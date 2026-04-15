import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User as DbUser } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  verificationNote?: string;
  verifiedAt?: Date;
  provider?: string;
  phoneNumber?: string;
  isVerified?: boolean;
  profilePicture?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthResponse {
  message: string;
  user: Partial<User>;
  token: string;
  refreshToken?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private supabaseService: SupabaseService,
    private prisma: PrismaService,
  ) {}

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedName = String(name || '').trim();
    const rawPassword = String(password || '');

    if (!normalizedEmail || !rawPassword || !normalizedName) {
      throw new UnauthorizedException('Email, password, and name are required');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        name: normalizedName,
        role: 'user',
        verificationStatus: 'approved',
        verifiedAt: new Date(),
        password: hashedPassword,
      } as any,
    });

    const authUser = this.mapDbUserToAuthUser(user, this.inferProvider(user));
    const tokens = await this.generateTokens(authUser);

    return {
      message: 'User registered successfully.',
      user: this.sanitizeUser(authUser),
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const rawPassword = String(password || '');

    if (!normalizedEmail || !rawPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!dbUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.assertUserCanAuthenticate(dbUser);

    const isPasswordValid = await this.verifyPasswordAndUpgrade(dbUser, rawPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const authUser = this.mapDbUserToAuthUser(dbUser, this.inferProvider(dbUser));
    authUser.lastLogin = new Date();
    const tokens = await this.generateTokens(authUser);

    return {
      message: 'Login successful',
      user: this.sanitizeUser(authUser),
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async adminLogin(email: string, password: string): Promise<AuthResponse> {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const rawPassword = String(password || '');

    if (!normalizedEmail || !rawPassword) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    // Primary path: Supabase Auth password login.
    const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
      email: normalizedEmail,
      password: rawPassword,
    });

    if (!error && data?.user) {
      const authUid = String(data.user.id);
      const adminUser = await this.resolveAdminUserForSupabaseLogin(normalizedEmail, authUid);
      this.assertUserCanAuthenticate(adminUser, true);
      const authUser = this.mapDbUserToAuthUser(adminUser, 'supabase');
      authUser.lastLogin = new Date();
      const tokens = await this.generateTokens(authUser);

      return {
        message: 'Admin login successful',
        user: this.sanitizeUser(authUser),
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    }

    // Compatibility fallback: app_user credential login for legacy rows with no Supabase auth_id.
    const adminUser = await this.prisma.user.findFirst({
      where: { email: normalizedEmail, role: 'admin' },
    });
    if (!adminUser) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    this.assertUserCanAuthenticate(adminUser, true);

    const isPasswordValid = await this.verifyPasswordAndUpgrade(adminUser, rawPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const authUser = this.mapDbUserToAuthUser(adminUser, 'local');
    authUser.lastLogin = new Date();
    const tokens = await this.generateTokens(authUser);

    return {
      message: 'Admin login successful',
      user: this.sanitizeUser(authUser),
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async exchangeSupabaseToken(accessToken: string): Promise<AuthResponse> {
    const token = String(accessToken || '').trim();
    if (!token) {
      throw new UnauthorizedException('Missing Supabase access token');
    }

    const { data, error } = await this.supabaseService.client.auth.getUser(token);
    if (error || !data?.user?.email) {
      throw new UnauthorizedException('Invalid Supabase session');
    }

    const email = String(data.user.email).trim().toLowerCase();
    const authId = String(data.user.id);
    const provider = String((data.user.app_metadata as any)?.provider || '').trim().toLowerCase();
    const isGoogleProvider = provider === 'google';
    const displayName =
      String(
        (data.user.user_metadata as any)?.full_name ||
          (data.user.user_metadata as any)?.name ||
          '',
      ).trim() || email.split('@')[0];

    let dbUser =
      (await this.prisma.user.findFirst({
        where: {
          OR: [{ authId }, { email }],
        },
      })) || null;

    if (!dbUser) {
      const initialVerificationStatus = isGoogleProvider ? 'pending' : 'approved';
      const verificationNote = isGoogleProvider
        ? 'Pending identity verification for new Google sign-in.'
        : null;
      dbUser = await this.prisma.user.create({
        data: {
          email,
          name: displayName,
          role: 'user',
          verificationStatus: initialVerificationStatus,
          verificationNote,
          verifiedAt: initialVerificationStatus === 'approved' ? new Date() : null,
          password: await bcrypt.hash(`sb_${randomUUID()}`, 12),
          authId,
        } as any,
      });
    } else {
      const updateData: {
        authId?: string;
        name?: string;
        verifiedAt?: Date;
      } = {};
      if (!dbUser.authId) {
        updateData.authId = authId;
      }
      if (!dbUser.name && displayName) {
        updateData.name = displayName;
      }
      if (
        dbUser.verificationStatus === 'approved' &&
        !dbUser.verifiedAt
      ) {
        updateData.verifiedAt = new Date();
      }
      if (Object.keys(updateData).length > 0) {
        dbUser = await this.prisma.user.update({
          where: { id: dbUser.id },
          data: updateData as any,
        });
      }
    }

    this.assertUserCanAuthenticate(dbUser);

    const authUser = this.mapDbUserToAuthUser(dbUser, 'supabase');
    authUser.lastLogin = new Date();
    const tokens = await this.generateTokens(authUser);

    return {
      message: 'Login successful',
      user: this.sanitizeUser(authUser),
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async createUser(email: string, name: string, role: string = 'user', password?: string) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedName = String(name || '').trim();
    const normalizedRole = String(role || 'user').trim().toLowerCase();

    if (!normalizedEmail || !normalizedName) {
      throw new UnauthorizedException('Email and name are required');
    }

    const plainPassword =
      String(password || '').trim() || `Temp-${randomUUID().slice(0, 12)}!`;
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    const user = await this.prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        name: normalizedName,
        role: normalizedRole,
      },
      create: {
        email: normalizedEmail,
        name: normalizedName,
        role: normalizedRole,
        verificationStatus: 'approved',
        verifiedAt: new Date(),
        password: hashedPassword,
      } as any,
    });

    // Best-effort: create/update Supabase Auth record and link auth_id.
    try {
      const { data, error } = await this.supabaseService.client.auth.admin.createUser({
        email: normalizedEmail,
        password: plainPassword,
        email_confirm: true,
        user_metadata: { name: normalizedName, role: normalizedRole },
      });

      if (!error && data?.user?.id && !user.authId) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { authId: data.user.id },
        });
      }
    } catch {
      // If Auth admin provisioning fails, app_user creation still stands.
    }

    return {
      message: 'User created successfully',
      user: this.sanitizeUser(this.mapDbUserToAuthUser(user, this.inferProvider(user))),
      temporaryPassword: plainPassword,
    };
  }

  async googleLogin(profile: any): Promise<AuthResponse> {
    const email = String(profile?.email || '').trim().toLowerCase();
    const name = String(profile?.name || '').trim() || email.split('@')[0];
    const picture = String(profile?.picture || '').trim() || undefined;
    if (!email) {
      throw new UnauthorizedException('Google profile email is required');
    }

    let dbUser = await this.prisma.user.findUnique({ where: { email } });
    if (!dbUser) {
      dbUser = await this.prisma.user.create({
        data: {
          email,
          name,
          role: 'user',
          password: await bcrypt.hash(`google_${randomUUID()}`, 12),
        },
      });
    }

    const authUser = this.mapDbUserToAuthUser(dbUser, 'google');
    authUser.isVerified = true;
    authUser.profilePicture = picture;
    authUser.lastLogin = new Date();
    const tokens = await this.generateTokens(authUser);

    return {
      message: 'Google login successful',
      user: this.sanitizeUser(authUser),
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async facebookLogin(profile: any): Promise<AuthResponse> {
    const email = String(profile?.email || '').trim().toLowerCase();
    const name = String(profile?.name || '').trim() || email.split('@')[0];
    const picture = String(profile?.picture || '').trim() || undefined;
    if (!email) {
      throw new UnauthorizedException('Facebook profile email is required');
    }

    let dbUser = await this.prisma.user.findUnique({ where: { email } });
    if (!dbUser) {
      dbUser = await this.prisma.user.create({
        data: {
          email,
          name,
          role: 'user',
          password: await bcrypt.hash(`facebook_${randomUUID()}`, 12),
        },
      });
    }

    const authUser = this.mapDbUserToAuthUser(dbUser, 'facebook');
    authUser.isVerified = true;
    authUser.profilePicture = picture;
    authUser.lastLogin = new Date();
    const tokens = await this.generateTokens(authUser);

    return {
      message: 'Facebook login successful',
      user: this.sanitizeUser(authUser),
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async phoneLogin(phoneNumber: string, verificationCode: string): Promise<AuthResponse> {
    // Mock SMS verification - in production, replace with provider-backed verification.
    if (verificationCode !== '123456') {
      throw new UnauthorizedException('Invalid verification code');
    }

    const phone = String(phoneNumber || '').trim();
    if (!phone) {
      throw new UnauthorizedException('Phone number is required');
    }

    const email = `${phone}@phone.local`;
    let dbUser = await this.prisma.user.findUnique({ where: { email } });
    if (!dbUser) {
      dbUser = await this.prisma.user.create({
        data: {
          email,
          name: `User ${phone}`,
          role: 'user',
          password: await bcrypt.hash(`phone_${randomUUID()}`, 12),
        },
      });
    }

    const authUser = this.mapDbUserToAuthUser(dbUser, 'phone');
    authUser.phoneNumber = phone;
    authUser.isVerified = true;
    authUser.lastLogin = new Date();
    const tokens = await this.generateTokens(authUser);

    return {
      message: 'Phone login successful',
      user: this.sanitizeUser(authUser),
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async sendPhoneVerification(phoneNumber: string): Promise<{ message: string }> {
    console.log(`Sending verification code to ${phoneNumber}`);
    return { message: 'Verification code sent successfully' };
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const dbUser = await this.prisma.user.findUnique({
        where: { id: String(payload.sub) },
      });
      if (!dbUser) {
        throw new UnauthorizedException('User not found');
      }

      const authUser = this.mapDbUserToAuthUser(dbUser, this.inferProvider(dbUser));
      const tokens = await this.generateTokens(authUser);

      return {
        message: 'Token refreshed successfully',
        user: this.sanitizeUser(authUser),
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getAllUsers(): Promise<Partial<User>[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => this.sanitizeUser(this.mapDbUserToAuthUser(u, this.inferProvider(u))));
  }

  async getUserById(id: string): Promise<Partial<User> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: String(id) },
    });
    if (!user) return null;
    return this.sanitizeUser(this.mapDbUserToAuthUser(user, this.inferProvider(user)));
  }

  async updateUser(id: string, updates: Partial<User>): Promise<Partial<User>> {
    // Keep role updates restricted to separate admin workflows.
    const { role, password, ...rest } = updates as any;
    const data: { email?: string; name?: string } = {};

    if (typeof rest?.email === 'string' && rest.email.trim()) {
      data.email = rest.email.trim().toLowerCase();
    }
    if (typeof rest?.name === 'string') {
      data.name = rest.name.trim();
    }

    let user: DbUser;
    if (Object.keys(data).length === 0) {
      const existing = await this.prisma.user.findUnique({
        where: { id: String(id) },
      });
      if (!existing) {
        throw new UnauthorizedException('Failed to update user');
      }
      user = existing;
    } else {
      user = await this.prisma.user.update({
        where: { id: String(id) },
        data,
      });
    }

    return this.sanitizeUser(this.mapDbUserToAuthUser(user, this.inferProvider(user)));
  }

  async updateUserVerification(
    id: string,
    status: 'pending' | 'approved' | 'rejected',
    note?: string,
  ): Promise<Partial<User>> {
    const normalizedStatus = String(status || '').trim().toLowerCase();
    const allowed = ['pending', 'approved', 'rejected'];
    if (!allowed.includes(normalizedStatus)) {
      throw new UnauthorizedException('Invalid verification status');
    }

    const user = await this.prisma.user.update({
      where: { id: String(id) },
      data: {
        verificationStatus: normalizedStatus,
        verificationNote: note ? String(note).trim() : null,
        verifiedAt: normalizedStatus === 'approved' ? new Date() : null,
      } as any,
    });

    return this.sanitizeUser(this.mapDbUserToAuthUser(user, this.inferProvider(user)));
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    await this.prisma.user.delete({
      where: { id: String(id) },
    });
    return { message: 'User deleted successfully' };
  }

  private async resolveAdminUserForSupabaseLogin(email: string, authUid: string) {
    let adminUser =
      (await this.prisma.user.findFirst({
        where: { authId: authUid, role: 'admin' },
      })) || null;

    if (!adminUser) {
      adminUser =
        (await this.prisma.user.findFirst({
          where: { email, role: 'admin' },
        })) || null;
    }

    if (!adminUser) {
      throw new UnauthorizedException('User not found or not admin');
    }

    if (!adminUser.authId) {
      adminUser = await this.prisma.user.update({
        where: { id: adminUser.id },
        data: { authId: authUid },
      });
    }

    return adminUser;
  }

  private mapDbUserToAuthUser(user: DbUser, provider: User['provider']): User {
    const rawUser = user as any;
    const verificationStatus = this.normalizeVerificationStatus(rawUser.verificationStatus);
    return {
      id: String(user.id),
      email: user.email,
      name: user.name || user.email.split('@')[0],
      role: user.role,
      verificationStatus,
      verificationNote: rawUser.verificationNote || undefined,
      verifiedAt: rawUser.verifiedAt || undefined,
      isVerified: verificationStatus === 'approved',
      provider,
      createdAt: user.createdAt,
    };
  }

  private inferProvider(user: DbUser): User['provider'] {
    return user.authId ? 'supabase' : 'local';
  }

  private async verifyPasswordAndUpgrade(user: DbUser, incomingPassword: string) {
    const storedPassword = String(user.password || '');
    if (!storedPassword) return false;

    // Normal case: bcrypt hash.
    if (/^\$2[aby]\$\d{2}\$/.test(storedPassword)) {
      return bcrypt.compare(incomingPassword, storedPassword);
    }

    // Legacy compatibility: plaintext in app_user.password.
    if (storedPassword === incomingPassword) {
      const hashed = await bcrypt.hash(incomingPassword, 12);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashed },
      });
      return true;
    }

    return false;
  }

  private sanitizeUser(user: User): Partial<User> {
    const { ...sanitized } = user;
    delete (sanitized as any).password;
    return sanitized;
  }

  private normalizeVerificationStatus(value: string | null | undefined): 'pending' | 'approved' | 'rejected' {
    const normalized = String(value || 'approved').trim().toLowerCase();
    if (normalized === 'pending' || normalized === 'rejected') {
      return normalized;
    }
    return 'approved';
  }

  private assertUserCanAuthenticate(user: DbUser, allowPendingAdmin = false) {
    const status = this.normalizeVerificationStatus((user as any).verificationStatus);

    if (status === 'pending') {
      if (allowPendingAdmin && user.role === 'admin') {
        return;
      }
      throw new UnauthorizedException(
        'Your account is pending verification. Please wait for approval before signing in.',
      );
    }

    if (status === 'rejected') {
      throw new UnauthorizedException(
        'Your account verification was rejected. Contact support for assistance.',
      );
    }
  }

  validateToken(token: string): any {
    try {
      return this.jwtService.verify(token);
    } catch {
      return null;
    }
  }
}
