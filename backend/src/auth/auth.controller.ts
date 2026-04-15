import { Controller, Post, Body, Get, Put, Delete, Param, UseGuards, Request, Query } from '@nestjs/common';
import { AuthService, AuthResponse } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminGuard } from './admin.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Traditional Authentication
  @Post('register')
  async register(@Body() body: { email: string; password: string; name: string }): Promise<AuthResponse> {
    return this.authService.register(body.email, body.password, body.name);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }): Promise<AuthResponse> {
    return this.authService.login(body.email, body.password);
  }

  @Post('admin-login')
  async adminLogin(@Body() body: { email: string; password: string }): Promise<AuthResponse> {
    return this.authService.adminLogin(body.email, body.password);
  }

  @Post('supabase/exchange')
  async exchangeSupabaseSession(@Body() body: { accessToken: string }): Promise<AuthResponse> {
    return this.authService.exchangeSupabaseToken(body.accessToken);
  }

  // Social Authentication
  @Post('google')
  async googleLogin(@Body() body: { idToken: string; profile: any }): Promise<AuthResponse> {
    // In production, verify the Google ID token
    return this.authService.googleLogin(body.profile);
  }

  @Post('facebook')
  async facebookLogin(@Body() body: { accessToken: string; profile: any }): Promise<AuthResponse> {
    // In production, verify the Facebook access token
    return this.authService.facebookLogin(body.profile);
  }

  @Post('phone/send-verification')
  async sendPhoneVerification(@Body() body: { phoneNumber: string }) {
    return this.authService.sendPhoneVerification(body.phoneNumber);
  }

  @Post('phone/verify')
  async phoneLogin(@Body() body: { phoneNumber: string; verificationCode: string }): Promise<AuthResponse> {
    return this.authService.phoneLogin(body.phoneNumber, body.verificationCode);
  }

  // Token Management
  @Post('refresh')
  async refreshToken(@Body() body: { refreshToken: string }): Promise<AuthResponse> {
    return this.authService.refreshToken(body.refreshToken);
  }

  // Protected Routes
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return this.authService.getUserById(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req, @Body() updates: any) {
    return this.authService.updateUser(req.user.id, updates);
  }

  // Admin Routes
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/users')
  async createUser(@Body() body: { email: string; name: string; role?: string; password?: string }) {
    return this.authService.createUser(body.email, body.name, body.role || 'user', body.password);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/users')
  async getAllUsers(@Query() query: { page?: number; limit?: number }) {
    const users = await this.authService.getAllUsers();
    const page = query.page || 1;
    const limit = query.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      users: users.slice(startIndex, endIndex),
      total: users.length,
      page,
      limit,
      totalPages: Math.ceil(users.length / limit)
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/users/:id')
  async getUserById(@Param('id') id: string) {
    return this.authService.getUserById(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('admin/users/:id')
  async updateUser(@Param('id') id: string, @Body() updates: any) {
    return this.authService.updateUser(id, updates);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('admin/users/:id/verification')
  async updateUserVerification(
    @Param('id') id: string,
    @Body() body: { status: 'pending' | 'approved' | 'rejected'; note?: string },
  ) {
    return this.authService.updateUserVerification(id, body.status, body.note);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('admin/users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/dashboard')
  async getAdminDashboard() {
    const users = await this.authService.getAllUsers();
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
      adminUsers: users.filter(u => u.role === 'admin').length,
      verifiedUsers: users.filter(u => u.isVerified).length,
      usersByProvider: {
        local: users.filter(u => u.provider === 'local').length,
        google: users.filter(u => u.provider === 'google').length,
        facebook: users.filter(u => u.provider === 'facebook').length,
        phone: users.filter(u => u.provider === 'phone').length
      }
    };

    return {
      message: 'Admin dashboard data',
      stats
    };
  }
}
