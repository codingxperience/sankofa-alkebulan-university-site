import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboardSummary() {
    return this.adminService.getDashboardSummary();
  }

  // Posts management
  @Get('posts')
  getAllPosts() {
    return this.adminService.getAllPosts();
  }

  @Post('posts')
  createPost(@Body() postData: any, @Req() req: any) {
    return this.adminService.createPost(postData, String(req?.user?.id || '').trim() || undefined);
  }

  @Put('posts/:id')
  updatePost(@Param('id') id: string, @Body() postData: any) {
    return this.adminService.updatePost(id, postData);
  }

  @Delete('posts/:id')
  deletePost(@Param('id') id: string) {
    return this.adminService.deletePost(id);
  }

  // Events management
  @Get('events')
  getAllEvents() {
    return this.adminService.getAllEvents();
  }

  @Post('events')
  createEvent(@Body() eventData: any) {
    return this.adminService.createEvent(eventData);
  }

  @Put('events/:id')
  updateEvent(@Param('id') id: string, @Body() eventData: any) {
    return this.adminService.updateEvent(id, eventData);
  }

  @Delete('events/:id')
  deleteEvent(@Param('id') id: string) {
    return this.adminService.deleteEvent(id);
  }

  // Products management
  @Get('products')
  getAllProducts() {
    return this.adminService.getAllProducts();
  }

  @Post('products')
  createProduct(@Body() productData: any) {
    return this.adminService.createProduct(productData);
  }

  @Put('products/:id')
  updateProduct(@Param('id') id: string, @Body() productData: any) {
    return this.adminService.updateProduct(id, productData);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(id);
  }

  // Orders management (placeholder for payment integration)
  @Get('orders')
  getAllOrders() {
    return this.adminService.getAllOrders();
  }

  @Post('orders')
  createOrder(@Body() orderData: any) {
    return this.adminService.createOrder(orderData);
  }

  @Put('orders/:id')
  updateOrder(@Param('id') id: string, @Body() orderData: any) {
    return this.adminService.updateOrder(id, orderData);
  }

  @Delete('orders/:id')
  deleteOrder(@Param('id') id: string) {
    return this.adminService.deleteOrder(id);
  }
}
