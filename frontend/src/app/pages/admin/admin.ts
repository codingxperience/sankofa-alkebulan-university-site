import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { MediaService, MediaFile } from '../../core/media';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { AdminDataService } from '../../admin-data.service';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PrimeIcons } from 'primeng/api';

// PrimeNG API
import { ConfirmationService, MessageService } from 'primeng/api';

interface DashboardStats {
  totalPosts: number;
  totalEvents: number;
  totalProducts: number;
  totalRevenue: number;
  recentActivity: Activity[];
}

interface Activity {
  id: string;
  type: 'post' | 'event' | 'user' | 'order';
  title: string;
  user: string;
  action: string;
  timestamp: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  status: 'active' | 'inactive' | 'draft';
  attendees: number;
  description?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: 'available' | 'out_of_stock' | 'discontinued';
  category: string;
  description?: string;
}

interface Order {
  id: string;
  customer: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'canceled';
  created_at: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'banned';
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verificationNote?: string;
  joined_at: string;
  role: string;
}

interface Post {
  id: string;
  title: string;
  author: string;
  status: 'published' | 'draft' | 'archived';
  created_at: string;
  published_at: string;
  content?: string;
  slug?: string;
}

type AdminTab =
  | 'dashboard'
  | 'posts'
  | 'events'
  | 'products'
  | 'orders'
  | 'users'
  | 'media'
  | 'settings';

type FilterableTab = 'posts' | 'events' | 'products' | 'orders' | 'users';

interface ListFilter {
  tab: FilterableTab;
  key: string;
  label: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    TableModule,
    DialogModule,
    InputTextModule,
    FileUploadModule,
    ProgressBarModule,
    BadgeModule,
    AvatarModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  styleUrls: ['./admin.scss'],
  template: `
    <div class="admin-layout">
      <!-- Debug Info (hidden by default) -->
      <div *ngIf="showDebug()" style="padding: 20px; background: #f0f0f0; border: 2px solid #333; margin: 10px;">
        <h3>DEBUG INFO:</h3>
        <p>Loading: {{ isLoading() }}</p>
        <p>Authenticated: {{ isAuthenticated() }}</p>
        <p>Is Admin: {{ isAdmin() }}</p>
        <p>Active Tab: {{ activeTab() }}</p>
      </div>

      <!-- Show loading or error states -->
      <div *ngIf="isLoading()" style="padding: 50px; text-align: center;">
        <h2>Loading Admin Dashboard...</h2>
      </div>

      <div *ngIf="!isLoading() && !isAuthenticated()" style="padding: 50px; text-align: center; color: red;">
        <h2>Authentication Required</h2>
        <p>You must be logged in as an admin to access this page.</p>
      </div>

      <div *ngIf="!isLoading() && isAuthenticated() && !isAdmin()" style="padding: 50px; text-align: center; color: orange;">
        <h2>Admin Access Required</h2>
        <p>You must have admin privileges to access this page.</p>
      </div>

      <!-- Main admin content - only show for authenticated admins -->
      <div *ngIf="!isLoading() && isAuthenticated() && isAdmin()" [class]="currentTheme() + '-theme'">
        <!-- Sidebar -->
        <div class="sidebar" [class.collapsed]="sidebarCollapsed()">
          <div class="sidebar-content">
            <!-- Header with Logo/Brand -->
            <div class="sidebar-header">
              <div class="brand-section" *ngIf="!sidebarCollapsed()">
                <div class="brand-logo">
                  <div class="logo-icon"></div>
                  <div class="brand-text">
                    <span>Admin Panel</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Navigation Menu -->
            <nav class="sidebar-nav">
              <!-- Main Navigation -->
              <div class="nav-group">
                <div class="nav-item" [class.active]="activeTab() === 'dashboard'" (click)="setTab('dashboard')">
                  <div class="nav-item-content" [title]="sidebarCollapsed() ? 'Dashboard' : ''">
                    <i class="pi pi-chart-line nav-icon"></i>
                    <span class="nav-text" *ngIf="!sidebarCollapsed()">Dashboard</span>
                  </div>
                  <div class="nav-indicator" *ngIf="activeTab() === 'dashboard'"></div>
                </div>
              </div>

              <!-- Content Section -->
              <div class="nav-group">
                <div class="nav-group-header" *ngIf="!sidebarCollapsed()">
                  <span>Content</span>
                  <div class="header-line"></div>
                </div>
                <div class="nav-item" [class.active]="activeTab() === 'posts'" (click)="setTab('posts')">
                  <div class="nav-item-content" [title]="sidebarCollapsed() ? 'Posts' : ''">
                    <i class="pi pi-file-edit nav-icon"></i>
                    <span class="nav-text" *ngIf="!sidebarCollapsed()">Posts</span>
                  </div>
                  <div class="nav-indicator" *ngIf="activeTab() === 'posts'"></div>
                </div>
                <div class="nav-item" [class.active]="activeTab() === 'media'" (click)="setTab('media')">
                  <div class="nav-item-content" [title]="sidebarCollapsed() ? 'Media' : ''">
                    <i class="pi pi-camera nav-icon"></i>
                    <span class="nav-text" *ngIf="!sidebarCollapsed()">Media</span>
                  </div>
                  <div class="nav-indicator" *ngIf="activeTab() === 'media'"></div>
                </div>
              </div>

              <!-- Management Section -->
              <div class="nav-group">
                <div class="nav-group-header" *ngIf="!sidebarCollapsed()">
                  <span>Management</span>
                  <div class="header-line"></div>
                </div>
                <div class="nav-item" [class.active]="activeTab() === 'users'" (click)="setTab('users')">
                  <div class="nav-item-content" [title]="sidebarCollapsed() ? 'Users' : ''">
                    <i class="pi pi-user nav-icon"></i>
                    <span class="nav-text" *ngIf="!sidebarCollapsed()">Users</span>
                  </div>
                  <div class="nav-indicator" *ngIf="activeTab() === 'users'"></div>
                </div>
                <div class="nav-item" [class.active]="activeTab() === 'events'" (click)="setTab('events')">
                  <div class="nav-item-content" [title]="sidebarCollapsed() ? 'Events' : ''">
                    <i class="pi pi-calendar-plus nav-icon"></i>
                    <span class="nav-text" *ngIf="!sidebarCollapsed()">Events</span>
                  </div>
                  <div class="nav-indicator" *ngIf="activeTab() === 'events'"></div>
                </div>
                <div class="nav-item" [class.active]="activeTab() === 'products'" (click)="setTab('products')">
                  <div class="nav-item-content" [title]="sidebarCollapsed() ? 'Products' : ''">
                    <i class="pi pi-box nav-icon"></i>
                    <span class="nav-text" *ngIf="!sidebarCollapsed()">Products</span>
                  </div>
                  <div class="nav-indicator" *ngIf="activeTab() === 'products'"></div>
                </div>
                <div class="nav-item" [class.active]="activeTab() === 'orders'" (click)="setTab('orders')">
                  <div class="nav-item-content" [title]="sidebarCollapsed() ? 'Orders' : ''">
                    <i class="pi pi-receipt nav-icon"></i>
                    <span class="nav-text" *ngIf="!sidebarCollapsed()">Orders</span>
                  </div>
                  <div class="nav-indicator" *ngIf="activeTab() === 'orders'"></div>
                </div>
              </div>

              <!-- Settings -->
              <div class="nav-group">
                <div class="nav-item" [class.active]="activeTab() === 'settings'" (click)="setTab('settings')">
                  <div class="nav-item-content" [title]="sidebarCollapsed() ? 'Settings' : ''">
                    <i class="pi pi-sliders-h nav-icon"></i>
                    <span class="nav-text" *ngIf="!sidebarCollapsed()">Settings</span>
                  </div>
                  <div class="nav-indicator" *ngIf="activeTab() === 'settings'"></div>
                </div>
              </div>
            </nav>

            <!-- User Profile Section -->
            <div class="sidebar-footer">
              <div class="user-profile" [class.expanded]="profileExpanded()" (click)="toggleProfile()">
                <div class="user-avatar-section">
                  <div class="user-avatar">
                    <p-avatar label="A" size="large" shape="circle" styleClass="avatar-modern"></p-avatar>
                    <div class="online-indicator"></div>
                  </div>
                  <div class="user-info" *ngIf="!sidebarCollapsed() && profileExpanded()">
                    <div class="user-name">Admin User</div>
                    <div class="user-role">Administrator</div>
                  </div>
                </div>
                <button class="profile-toggle" *ngIf="!sidebarCollapsed()">
                  <i class="pi" [class]="profileExpanded() ? 'pi-chevron-down' : 'pi-chevron-up'"></i>
                </button>
              </div>

              <div class="profile-menu" *ngIf="profileExpanded() && !sidebarCollapsed()">
                <div class="profile-menu-item" (click)="logout()">
                  <i class="pi pi-sign-out"></i>
                  <span>Logout</span>
                </div>
                <div class="profile-menu-item" (click)="setTab('settings')">
                  <i class="pi pi-user"></i>
                  <span>Profile</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      <!-- Main Content -->
      <div class="main-content" [class.sidebar-collapsed]="sidebarCollapsed()">
        <!-- Header -->
        <div class="admin-toolbar">
          <div class="toolbar-group-start">
            <span class="page-title">{{ getPageTitle() }}</span>
          </div>
          <div class="toolbar-group-end">
            <p-button icon="pi pi-bell" class="p-button-text p-button-lg" pBadge="3" badgeClass="p-badge-danger"></p-button>
            <p-avatar label="A" styleClass="mr-2" size="large" shape="circle"></p-avatar>
            <p-button label="Admin" icon="pi pi-user" class="p-button-text"></p-button>
          </div>
        </div>

        <!-- Dashboard Content -->
        <div class="dashboard-content fade-in" *ngIf="activeTab() === 'dashboard'">
          <!-- Welcome Section -->
          <div class="welcome-section">
            <h1>Welcome back, Admin! 👋</h1>
            <p>Here's what's happening with your Sankofa Alkebulan platform today.</p>
            <div class="quick-actions">
              <p-button label="Add New Post" icon="pi pi-plus" class="p-button-primary" (click)="setTab('posts'); createItem()"></p-button>
              <p-button label="Upload Media" icon="pi pi-upload" class="p-button-secondary" (click)="setTab('media')"></p-button>
              <p-button label="View Users" icon="pi pi-users" class="p-button-help" (click)="setTab('users')"></p-button>
            </div>
          </div>

          <!-- Stats Cards -->
          <div class="stats-grid">
            <div class="stat-card primary" (click)="setTabWithFilter('posts', 'published')" style="cursor: pointer;">
              <div class="stat-header">
                <div class="stat-icon-wrapper">
                  <i class="pi pi-file-text stat-icon"></i>
                </div>
                <div class="stat-trend positive">
                  <i class="pi pi-arrow-up"></i>
                  <span>+12%</span>
                </div>
              </div>
              <div class="stat-content">
                <h3>{{ dashboardStats().totalPosts }}</h3>
                <p>Total Posts</p>
                <div class="stat-subtitle">{{ getPublishedPostsCount() }} published, {{ getDraftPostsCount() }} drafts</div>
              </div>
              <div class="stat-footer">
                <span class="stat-link">Manage Posts →</span>
              </div>
            </div>

            <div class="stat-card success" (click)="setTabWithFilter('users', 'active')" style="cursor: pointer;">
              <div class="stat-header">
                <div class="stat-icon-wrapper">
                  <i class="pi pi-users stat-icon"></i>
                </div>
                <div class="stat-trend positive">
                  <i class="pi pi-arrow-up"></i>
                  <span>+8%</span>
                </div>
              </div>
              <div class="stat-content">
                <h3>{{ getActiveUsersCount() }}</h3>
                <p>Active Users</p>
                <div class="stat-subtitle">{{ users().length }} total registered</div>
              </div>
              <div class="stat-footer">
                <span class="stat-link">Manage Users →</span>
              </div>
            </div>

            <div class="stat-card info" (click)="setTabWithFilter('events', 'upcoming')" style="cursor: pointer;">
              <div class="stat-header">
                <div class="stat-icon-wrapper">
                  <i class="pi pi-calendar stat-icon"></i>
                </div>
                <div class="stat-trend positive">
                  <i class="pi pi-arrow-up"></i>
                  <span>+15%</span>
                </div>
              </div>
              <div class="stat-content">
                <h3>{{ dashboardStats().totalEvents }}</h3>
                <p>Upcoming Events</p>
                <div class="stat-subtitle">{{ getUpcomingEventsThisWeek() }} this week, {{ getUpcomingEventsThisMonth() }} this month</div>
              </div>
              <div class="stat-footer">
                <span class="stat-link">Manage Events →</span>
              </div>
            </div>

            <div class="stat-card warning" (click)="setTabWithFilter('orders', 'delivered')" style="cursor: pointer;">
              <div class="stat-header">
                <div class="stat-icon-wrapper">
                  <i class="pi pi-dollar stat-icon"></i>
                </div>
                <div class="stat-trend positive">
                  <i class="pi pi-arrow-up"></i>
                  <span>+23%</span>
                </div>
              </div>
              <div class="stat-content">
                <h3>{{ formatCurrency(dashboardStats().totalRevenue) }}</h3>
                <p>Monthly Revenue</p>
                <div class="stat-subtitle">{{ getDeliveredOrdersCount() }} delivered orders</div>
              </div>
              <div class="stat-footer">
                <span class="stat-link">View Reports →</span>
              </div>
            </div>
          </div>

          <!-- Analytics Row -->
          <div class="analytics-row">
            <!-- Traffic Chart -->
            <div class="chart-card">
              <div class="chart-header">
                <h4>Website Traffic</h4>
                <div class="chart-controls">
                  <p-button label="7d" class="p-button-text p-button-sm active" (click)="setChartPeriod('7d')"></p-button>
                  <p-button label="30d" class="p-button-text p-button-sm" (click)="setChartPeriod('30d')"></p-button>
                  <p-button label="90d" class="p-button-text p-button-sm" (click)="setChartPeriod('90d')"></p-button>
                </div>
              </div>
              <div class="chart-placeholder">
                <div class="chart-bars">
                  <div class="bar" [style.height.%]="40"></div>
                  <div class="bar" [style.height.%]="60"></div>
                  <div class="bar" [style.height.%]="30"></div>
                  <div class="bar" [style.height.%]="80"></div>
                  <div class="bar" [style.height.%]="50"></div>
                  <div class="bar" [style.height.%]="70"></div>
                  <div class="bar" [style.height.%]="45"></div>
                </div>
                <div class="chart-labels">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>

            <!-- Recent Activity -->
            <div class="activity-card">
              <div class="activity-header">
                <h4>Recent Activity</h4>
                <p-button label="View All" icon="pi pi-external-link" class="p-button-text p-button-sm"></p-button>
              </div>
              <div class="activity-list">
                <div class="activity-item" *ngFor="let activity of dashboardStats().recentActivity; let i = index" [class.fade-in]="true" [style.animation-delay.ms]="i * 100">
                  <div class="activity-avatar">
                    <div class="avatar-circle" [style.background]="getActivityColor(activity.type)">
                      <i [class]="getActivityIconClass(activity.type)"></i>
                    </div>
                  </div>
                  <div class="activity-content">
                    <div class="activity-title">{{ activity.title }}</div>
                    <div class="activity-meta">
                      <span class="activity-user">{{ activity.user }}</span>
                      <span class="activity-time">{{ formatTimeAgo(activity.timestamp) }}</span>
                    </div>
                  </div>
                  <div class="activity-actions">
                    <p-button icon="pi pi-ellipsis-v" class="p-button-text p-button-sm" (click)="showActivityMenu($event, activity)"></p-button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions Grid -->
          <div class="actions-section">
            <h4>Quick Actions</h4>
            <div class="actions-grid">
              <div class="action-card" (click)="createItem()">
                <div class="action-icon primary">
                  <i class="pi pi-plus"></i>
                </div>
                <div class="action-content">
                  <h5>Create Content</h5>
                  <p>Add new posts, events, or products</p>
                </div>
                <div class="action-arrow">
                  <i class="pi pi-arrow-right"></i>
                </div>
              </div>

              <div class="action-card" (click)="setTab('media')">
                <div class="action-icon secondary">
                  <i class="pi pi-images"></i>
                </div>
                <div class="action-content">
                  <h5>Manage Media</h5>
                  <p>Upload and organize files</p>
                </div>
                <div class="action-arrow">
                  <i class="pi pi-arrow-right"></i>
                </div>
              </div>

              <div class="action-card" (click)="setTab('users')">
                <div class="action-icon success">
                  <i class="pi pi-users"></i>
                </div>
                <div class="action-content">
                  <h5>User Management</h5>
                  <p>Manage user accounts and permissions</p>
                </div>
                <div class="action-arrow">
                  <i class="pi pi-arrow-right"></i>
                </div>
              </div>

              <div class="action-card" (click)="setTab('settings')">
                <div class="action-icon info">
                  <i class="pi pi-cog"></i>
                </div>
                <div class="action-content">
                  <h5>Settings</h5>
                  <p>Configure site preferences</p>
                </div>
                <div class="action-arrow">
                  <i class="pi pi-arrow-right"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Posts Management -->
        <div class="content-section fade-in" *ngIf="activeTab() === 'posts'">
          <div class="section-header">
            <h4>Posts Management</h4>
            <p-button label="New Post" icon="pi pi-plus" (click)="createItem()"></p-button>
          </div>
          <div class="active-filter-banner" *ngIf="activeFilterLabelForTab('posts') as filterLabel">
            <span>Filtered view: {{ filterLabel }}</span>
            <button type="button" class="clear-filter-btn" (click)="clearListFilter()">Clear</button>
          </div>

          <p-table [value]="displayedPosts()" [paginator]="true" [rows]="10" [loading]="isLoading()"
                   selectionMode="multiple" [(selection)]="selectedPosts">
            <ng-template pTemplate="header">
              <tr>
                <th style="width: 3rem">
                  <p-tableHeaderCheckbox></p-tableHeaderCheckbox>
                </th>
                <th>Title</th>
                <th>Author</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-post>
              <tr>
                <td>
                  <p-tableCheckbox [value]="post"></p-tableCheckbox>
                </td>
                <td>{{ post.title }}</td>
                <td>{{ post.author }}</td>
                <td>
                  <p-badge [value]="post.status" [severity]="getStatusSeverity(post.status)"></p-badge>
                </td>
                <td>{{ formatDate(post.created_at) }}</td>
                <td>
                  <p-button icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="editItem(post)"></p-button>
                  <p-button icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" (click)="deleteItem(post)"></p-button>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Users Management -->
        <div class="content-section fade-in" *ngIf="activeTab() === 'users'">
          <div class="section-header">
            <h4>Users Management</h4>
            <p-button label="Add User" icon="pi pi-plus" (click)="createItem()"></p-button>
          </div>
          <div class="active-filter-banner" *ngIf="activeFilterLabelForTab('users') as filterLabel">
            <span>Filtered view: {{ filterLabel }}</span>
            <button type="button" class="clear-filter-btn" (click)="clearListFilter()">Clear</button>
          </div>

          <p-table [value]="displayedUsers()" [paginator]="true" [rows]="10" [loading]="isLoading()"
                   selectionMode="multiple" [(selection)]="selectedUsers">
            <ng-template pTemplate="header">
              <tr>
                <th style="width: 3rem">
                  <p-tableHeaderCheckbox></p-tableHeaderCheckbox>
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Verification</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-user>
              <tr>
                <td>
                  <p-tableCheckbox [value]="user"></p-tableCheckbox>
                </td>
                <td>
                  <div class="user-cell">
                    <p-avatar [label]="user.name.charAt(0)" styleClass="mr-2"></p-avatar>
                    {{ user.name }}
                  </div>
                </td>
                <td>{{ user.email }}</td>
                <td>
                  <p-badge [value]="user.role" severity="info"></p-badge>
                </td>
                <td>
                  <p-badge [value]="user.verificationStatus" [severity]="getStatusSeverity(user.verificationStatus)"></p-badge>
                </td>
                <td>
                  <p-badge [value]="user.status" [severity]="getStatusSeverity(user.status)"></p-badge>
                </td>
                <td>{{ formatDate(user.joined_at) }}</td>
                <td>
                  <p-button
                    *ngIf="user.verificationStatus !== 'approved'"
                    icon="pi pi-check"
                    class="p-button-text p-button-success p-button-sm"
                    (click)="setUserVerification(user, 'approved')"
                  ></p-button>
                  <p-button icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="editItem(user)"></p-button>
                  <p-button icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" (click)="deleteItem(user)"></p-button>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Events Management -->
        <div class="content-section fade-in" *ngIf="activeTab() === 'events'">
          <div class="section-header">
            <h4>Events Management</h4>
            <p-button label="New Event" icon="pi pi-plus" (click)="createItem()"></p-button>
          </div>
          <div class="active-filter-banner" *ngIf="activeFilterLabelForTab('events') as filterLabel">
            <span>Filtered view: {{ filterLabel }}</span>
            <button type="button" class="clear-filter-btn" (click)="clearListFilter()">Clear</button>
          </div>

          <p-table [value]="displayedEvents()" [paginator]="true" [rows]="10" [loading]="isLoading()"
                   selectionMode="multiple" [(selection)]="selectedEvents">
            <ng-template pTemplate="header">
              <tr>
                <th style="width: 3rem">
                  <p-tableHeaderCheckbox></p-tableHeaderCheckbox>
                </th>
                <th>Title</th>
                <th>Date</th>
                <th>Location</th>
                <th>Attendees</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-event>
              <tr>
                <td>
                  <p-tableCheckbox [value]="event"></p-tableCheckbox>
                </td>
                <td>{{ event.title }}</td>
                <td>{{ formatDate(event.date) }}</td>
                <td>{{ event.location }}</td>
                <td>{{ event.attendees }}</td>
                <td>
                  <p-badge [value]="event.status" [severity]="getStatusSeverity(event.status)"></p-badge>
                </td>
                <td>
                  <p-button icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="editItem(event)"></p-button>
                  <p-button icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" (click)="deleteItem(event)"></p-button>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Products Management -->
        <div class="content-section fade-in" *ngIf="activeTab() === 'products'">
          <div class="section-header">
            <h4>Products Management</h4>
            <p-button label="New Product" icon="pi pi-plus" (click)="createItem()"></p-button>
          </div>
          <div class="active-filter-banner" *ngIf="activeFilterLabelForTab('products') as filterLabel">
            <span>Filtered view: {{ filterLabel }}</span>
            <button type="button" class="clear-filter-btn" (click)="clearListFilter()">Clear</button>
          </div>

          <p-table [value]="displayedProducts()" [paginator]="true" [rows]="10" [loading]="isLoading()"
                   selectionMode="multiple" [(selection)]="selectedProducts">
            <ng-template pTemplate="header">
              <tr>
                <th style="width: 3rem">
                  <p-tableHeaderCheckbox></p-tableHeaderCheckbox>
                </th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-product>
              <tr>
                <td>
                  <p-tableCheckbox [value]="product"></p-tableCheckbox>
                </td>
                <td>{{ product.name }}</td>
                <td>{{ product.category }}</td>
                <td>{{ formatCurrency(product.price) }}</td>
                <td>{{ product.stock }}</td>
                <td>
                  <p-badge [value]="product.status" [severity]="getStatusSeverity(product.status)"></p-badge>
                </td>
                <td>
                  <p-button icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="editItem(product)"></p-button>
                  <p-button icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" (click)="deleteItem(product)"></p-button>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Orders Management -->
        <div class="content-section fade-in" *ngIf="activeTab() === 'orders'">
          <div class="section-header">
            <h4>Orders Management</h4>
          </div>
          <div class="active-filter-banner" *ngIf="activeFilterLabelForTab('orders') as filterLabel">
            <span>Filtered view: {{ filterLabel }}</span>
            <button type="button" class="clear-filter-btn" (click)="clearListFilter()">Clear</button>
          </div>

          <p-table [value]="displayedOrders()" [paginator]="true" [rows]="10" [loading]="isLoading()"
                   selectionMode="multiple" [(selection)]="selectedOrders">
            <ng-template pTemplate="header">
              <tr>
                <th style="width: 3rem">
                  <p-tableHeaderCheckbox></p-tableHeaderCheckbox>
                </th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-order>
              <tr>
                <td>
                  <p-tableCheckbox [value]="order"></p-tableCheckbox>
                </td>
                <td>{{ order.id }}</td>
                <td>{{ order.customer }}</td>
                <td>{{ formatCurrency(order.total) }}</td>
                <td>
                  <p-badge [value]="order.status" [severity]="getStatusSeverity(order.status)"></p-badge>
                </td>
                <td>{{ formatDate(order.created_at) }}</td>
                <td>
                  <p-button icon="pi pi-eye" class="p-button-text p-button-sm" (click)="viewOrder(order)"></p-button>
                  <p-button icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="editItem(order)"></p-button>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Media Management -->
        <div class="content-section fade-in" *ngIf="activeTab() === 'media'">
          <div class="section-header">
            <h4>Media Library</h4>
            <p-fileUpload mode="basic" chooseLabel="Upload Files" [multiple]="true" accept="image/*,video/*,audio/*,application/*"
                         [maxFileSize]="10000000" (onSelect)="onFileSelected($event)" [disabled]="isUploading()">
            </p-fileUpload>
          </div>

          <div class="media-filters">
            <p-button [label]="getMediaFilterLabel('all')" class="p-button-text" [class.active]="mediaCategory() === 'all'" (click)="filterByCategory('all')"></p-button>
            <p-button [label]="getMediaFilterLabel('images')" class="p-button-text" [class.active]="mediaCategory() === 'images'" (click)="filterByCategory('images')"></p-button>
            <p-button [label]="getMediaFilterLabel('videos')" class="p-button-text" [class.active]="mediaCategory() === 'videos'" (click)="filterByCategory('videos')"></p-button>
            <p-button [label]="getMediaFilterLabel('documents')" class="p-button-text" [class.active]="mediaCategory() === 'documents'" (click)="filterByCategory('documents')"></p-button>
          </div>

          <div class="media-grid">
            <div class="media-item" *ngFor="let file of filteredMediaFiles()">
              <div class="media-preview" (click)="playMedia(file)">
                <i [class]="getFileIconClass(file.mimetype)" class="media-icon"></i>
                <img *ngIf="file.mimetype.startsWith('image/')" [src]="file.url" [alt]="file.filename" class="media-thumbnail">
              </div>
              <div class="media-info">
                <div class="media-name">{{ file.filename }}</div>
                <div class="media-meta">{{ formatFileSize(file.size) }} • {{ formatDate(file.uploadedAt) }}</div>
              </div>
              <div class="media-actions">
                <p-button icon="pi pi-download" class="p-button-text p-button-sm" (click)="downloadFile(file)"></p-button>
                <p-button icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" (click)="deleteMedia(file)"></p-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings Content -->
      <div class="content-section fade-in" *ngIf="activeTab() === 'settings'">
        <div class="section-header">
          <h4>Settings</h4>
          <p>Manage your application preferences and configuration.</p>
        </div>

        <div class="settings-grid">
          <!-- Theme Settings -->
          <div class="settings-card">
            <div class="settings-card-header">
              <i class="pi pi-palette settings-icon"></i>
              <h5>Appearance</h5>
            </div>
            <div class="settings-card-content">
              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">Theme</span>
                  <span class="setting-description">Choose your preferred theme</span>
                </div>
                <p-button
                  [icon]="currentTheme() === 'light' ? 'pi pi-sun' : 'pi pi-moon'"
                  [label]="currentTheme() === 'light' ? 'Light' : 'Dark'"
                  class="p-button-outlined"
                  (click)="toggleTheme()">
                </p-button>
              </div>
            </div>
          </div>

          <!-- Account Settings -->
          <div class="settings-card">
            <div class="settings-card-header">
              <i class="pi pi-user settings-icon"></i>
              <h5>Account</h5>
            </div>
            <div class="settings-card-content">
              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">Profile</span>
                  <span class="setting-description">Update your profile information</span>
                </div>
                <p-button label="Edit Profile" icon="pi pi-pencil" class="p-button-outlined"></p-button>
              </div>
              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">Password</span>
                  <span class="setting-description">Change your password</span>
                </div>
                <p-button label="Change Password" icon="pi pi-lock" class="p-button-outlined"></p-button>
              </div>
            </div>
          </div>

          <!-- System Settings -->
          <div class="settings-card">
            <div class="settings-card-header">
              <i class="pi pi-cog settings-icon"></i>
              <h5>System</h5>
            </div>
            <div class="settings-card-content">
              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">Notifications</span>
                  <span class="setting-description">Manage notification preferences</span>
                </div>
                <p-button label="Configure" icon="pi pi-bell" class="p-button-outlined"></p-button>
              </div>
              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">Backup</span>
                  <span class="setting-description">Create system backup</span>
                </div>
                <p-button label="Backup Now" icon="pi pi-save" class="p-button-outlined"></p-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modals -->
      <p-dialog [(visible)]="showCreateModal" [style]="{width: '600px'}" [header]="getModalTitle()" [modal]="true" styleClass="p-fluid">
        <form [formGroup]="itemForm" *ngIf="itemForm">
          <ng-container [ngSwitch]="activeTab()">
            <ng-container *ngSwitchCase="'posts'">
              <div class="p-field">
                <label for="post-title">Title</label>
                <input pInputText id="post-title" formControlName="title" placeholder="Enter post title">
                <small class="field-error" *ngIf="showFieldError('title')">{{ getFieldError('title') }}</small>
              </div>
              <div class="p-field">
                <label for="post-slug">Slug (optional)</label>
                <input pInputText id="post-slug" formControlName="slug" placeholder="custom-post-slug">
              </div>
              <div class="p-field">
                <label for="post-status">Status</label>
                <select id="post-status" formControlName="status">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                <small class="field-error" *ngIf="showFieldError('status')">{{ getFieldError('status') }}</small>
              </div>
              <div class="p-field">
                <label for="post-content">Content</label>
                <textarea id="post-content" rows="5" formControlName="content" placeholder="Write post content"></textarea>
                <small class="field-error" *ngIf="showFieldError('content')">{{ getFieldError('content') }}</small>
              </div>
            </ng-container>

            <ng-container *ngSwitchCase="'events'">
              <div class="p-field">
                <label for="event-title">Title</label>
                <input pInputText id="event-title" formControlName="title" placeholder="Enter event title">
                <small class="field-error" *ngIf="showFieldError('title')">{{ getFieldError('title') }}</small>
              </div>
              <div class="p-field">
                <label for="event-date">Date</label>
                <input pInputText id="event-date" type="datetime-local" formControlName="date" placeholder="YYYY-MM-DDTHH:mm:ssZ">
                <small class="field-error" *ngIf="showFieldError('date')">{{ getFieldError('date') }}</small>
              </div>
              <div class="p-field">
                <label for="event-location">Location</label>
                <input pInputText id="event-location" formControlName="location" placeholder="Event location">
              </div>
              <div class="p-field">
                <label for="event-status">Status</label>
                <select id="event-status" formControlName="status">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <small class="field-error" *ngIf="showFieldError('status')">{{ getFieldError('status') }}</small>
              </div>
              <div class="p-field">
                <label for="event-attendees">Attendees</label>
                <input pInputText id="event-attendees" formControlName="attendees" type="number" min="0">
                <small class="field-error" *ngIf="showFieldError('attendees')">{{ getFieldError('attendees') }}</small>
              </div>
              <div class="p-field">
                <label for="event-description">Description</label>
                <textarea id="event-description" rows="4" formControlName="description" placeholder="Event details"></textarea>
              </div>
            </ng-container>

            <ng-container *ngSwitchCase="'products'">
              <div class="p-field">
                <label for="product-name">Name</label>
                <input pInputText id="product-name" formControlName="title" placeholder="Product name">
                <small class="field-error" *ngIf="showFieldError('title')">{{ getFieldError('title') }}</small>
              </div>
              <div class="p-field">
                <label for="product-price">Price</label>
                <input pInputText id="product-price" formControlName="price" type="number" min="0.01" step="0.01">
                <small class="field-error" *ngIf="showFieldError('price')">{{ getFieldError('price') }}</small>
              </div>
              <div class="p-field">
                <label for="product-stock">Stock</label>
                <input pInputText id="product-stock" formControlName="stock" type="number" min="0">
                <small class="field-error" *ngIf="showFieldError('stock')">{{ getFieldError('stock') }}</small>
              </div>
              <div class="p-field">
                <label for="product-category">Category</label>
                <input pInputText id="product-category" formControlName="category" placeholder="General">
                <small class="field-error" *ngIf="showFieldError('category')">{{ getFieldError('category') }}</small>
              </div>
              <div class="p-field">
                <label for="product-status">Status</label>
                <select id="product-status" formControlName="status">
                  <option value="available">Available</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="discontinued">Discontinued</option>
                </select>
                <small class="field-error" *ngIf="showFieldError('status')">{{ getFieldError('status') }}</small>
              </div>
              <div class="p-field">
                <label for="product-description">Description</label>
                <textarea id="product-description" rows="4" formControlName="description" placeholder="Product description"></textarea>
              </div>
            </ng-container>

            <ng-container *ngSwitchCase="'orders'">
              <div class="p-field">
                <label for="order-total">Order Total</label>
                <input pInputText id="order-total" formControlName="total" type="number" min="0.01" step="0.01">
                <small class="field-error" *ngIf="showFieldError('total')">{{ getFieldError('total') }}</small>
              </div>
              <div class="p-field">
                <label for="order-status">Order Status</label>
                <select id="order-status" formControlName="status">
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="canceled">Canceled</option>
                </select>
                <small class="field-error" *ngIf="showFieldError('status')">{{ getFieldError('status') }}</small>
              </div>
            </ng-container>

            <ng-container *ngSwitchCase="'users'">
              <div class="p-field">
                <label for="user-name">Name</label>
                <input pInputText id="user-name" formControlName="title" placeholder="Full name">
                <small class="field-error" *ngIf="showFieldError('title')">{{ getFieldError('title') }}</small>
              </div>
              <div class="p-field">
                <label for="user-email">Email</label>
                <input pInputText id="user-email" formControlName="email" placeholder="user@example.com">
                <small class="field-error" *ngIf="showFieldError('email')">{{ getFieldError('email') }}</small>
              </div>
              <div class="p-field">
                <label for="user-role">Role</label>
                <select id="user-role" formControlName="role">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <small class="field-error" *ngIf="showFieldError('role')">{{ getFieldError('role') }}</small>
              </div>
            </ng-container>
          </ng-container>
        </form>
        <ng-template pTemplate="footer">
          <p-button label="Cancel" icon="pi pi-times" class="p-button-text" (click)="closeModal()"></p-button>
          <p-button label="Save" icon="pi pi-check" class="p-button-text" (click)="saveItem()"></p-button>
        </ng-template>
      </p-dialog>

      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>
      </div>
    </div>
  `,
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0 })),
      transition('void <=> *', animate('300ms ease-in-out'))
    ]),
    trigger('slideIn', [
      state('void', style({ transform: 'translateX(-100%)', opacity: 0 })),
      transition('void <=> *', animate('300ms ease-out'))
    ])
  ]
})
export class Admin implements OnInit, OnDestroy {
  private mediaService = inject(MediaService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private adminDataService = inject(AdminDataService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // UI state
  currentTheme = signal<'light' | 'dark'>('light');
  sidebarCollapsed = signal(false);
  profileExpanded = signal(false);
  isLoading = signal(true);
  isUploading = signal(false);
  isAuthenticated = signal(false);
  isAdmin = signal(false);
  // Toggle debug panel visibility (false by default)
  showDebug = signal(false);

  // Dashboard state
  activeTab = signal<AdminTab>('dashboard');
  searchQuery = signal('');
  selectedItems = signal<string[]>([]);
  mediaCategory = signal<'all' | 'images' | 'videos' | 'documents'>('all');
  uploadProgress = signal(0);
  activeListFilter = signal<ListFilter | null>(null);
  formSubmitted = signal(false);

  // Modal states
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);

  // Subscriptions
  private authSubscription?: Subscription;
  private liveRefreshTimer?: ReturnType<typeof setInterval>;

  // Form
  itemForm!: FormGroup;

  // Table selections
  selectedPosts: Post[] = [];
  selectedUsers: User[] = [];
  selectedEvents: Event[] = [];
  selectedProducts: Product[] = [];
  selectedOrders: Order[] = [];

  // Data signals
  dashboardStats = signal<DashboardStats>({
    totalPosts: 0,
    totalEvents: 0,
    totalProducts: 0,
    totalRevenue: 0,
    recentActivity: []
  });

  posts = signal<Post[]>([]);
  events = signal<Event[]>([]);
  products = signal<Product[]>([]);
  orders = signal<Order[]>([]);
  users = signal<User[]>([]);
  mediaFiles = signal<MediaFile[]>([]);

  // Current editing item
  editingItem = signal<any>(null);

  ngOnInit() {
    console.log('Admin component initialized');

    // Subscribe to authentication state changes
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      console.log('Auth state changed:', { user, isAuthenticated: !!user && !!this.authService.getToken(), isAdmin: user?.role === 'admin' });

      // Update signals based on current user
      this.isAuthenticated.set(!!user && !!this.authService.getToken());
      this.isAdmin.set(user?.role === 'admin');

      // Check authentication on client side
      if (typeof window !== 'undefined') {
        if (!this.isAuthenticated()) {
          console.log('Not authenticated, redirecting to login');
          this.stopLiveRefresh();
          this.router.navigate(['/login']);
          return;
        }

        if (!this.isAdmin()) {
          console.log('Not an admin, redirecting to home');
          this.stopLiveRefresh();
          this.router.navigate(['/']);
          return;
        }

        console.log('Authentication passed, loading admin dashboard');
        this.initializeForm();
        this.loadDashboardData();
        this.startLiveRefresh();
      }
    });
  }

  initializeForm() {
    this.itemForm = this.fb.group({
      title: [''],
      content: [''],
      slug: [''],
      email: [''],
      role: ['user'],
      date: [null],
      location: [''],
      attendees: [0],
      status: ['draft'],
      price: [''],
      stock: [0],
      category: ['General'],
      description: [''],
      total: [''],
    });
    this.applyFormValidators(this.activeTab());
  }

  private applyFormValidators(tab: AdminTab) {
    if (!this.itemForm) return;

    Object.values(this.itemForm.controls).forEach((control) => {
      control.clearValidators();
      control.updateValueAndValidity({ emitEvent: false });
    });

    switch (tab) {
      case 'posts':
        this.itemForm.get('title')?.setValidators([Validators.required, Validators.minLength(3)]);
        this.itemForm.get('content')?.setValidators([Validators.required, Validators.minLength(20)]);
        this.itemForm.get('status')?.setValidators([Validators.required]);
        break;
      case 'events':
        this.itemForm.get('title')?.setValidators([Validators.required, Validators.minLength(3)]);
        this.itemForm.get('date')?.setValidators([Validators.required]);
        this.itemForm.get('attendees')?.setValidators([Validators.min(0)]);
        this.itemForm.get('status')?.setValidators([Validators.required]);
        break;
      case 'products':
        this.itemForm.get('title')?.setValidators([Validators.required, Validators.minLength(2)]);
        this.itemForm.get('price')?.setValidators([Validators.required, Validators.min(0.01)]);
        this.itemForm.get('stock')?.setValidators([Validators.required, Validators.min(0)]);
        this.itemForm.get('category')?.setValidators([Validators.required]);
        this.itemForm.get('status')?.setValidators([Validators.required]);
        break;
      case 'orders':
        this.itemForm.get('total')?.setValidators([Validators.required, Validators.min(0.01)]);
        this.itemForm.get('status')?.setValidators([Validators.required]);
        break;
      case 'users':
        this.itemForm.get('title')?.setValidators([Validators.required, Validators.minLength(2)]);
        this.itemForm.get('email')?.setValidators([Validators.required, Validators.email]);
        this.itemForm.get('role')?.setValidators([Validators.required]);
        break;
      default:
        break;
    }

    Object.values(this.itemForm.controls).forEach((control) => {
      control.updateValueAndValidity({ emitEvent: false });
    });
  }

  showFieldError(controlName: string): boolean {
    const control = this.itemForm?.get(controlName);
    if (!control) return false;
    return control.invalid && (control.touched || control.dirty || this.formSubmitted());
  }

  getFieldError(controlName: string): string {
    const control = this.itemForm?.get(controlName);
    if (!control?.errors) return '';

    const errors = control.errors;
    if (errors['required']) return 'This field is required.';
    if (errors['email']) return 'Enter a valid email address.';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} characters required.`;
    if (errors['min']) return `Value must be at least ${errors['min'].min}.`;
    return 'Invalid value.';
  }

  async loadDashboardData() {
    await this.fetchAdminData(true);
  }

  private async fetchAdminData(showLoader: boolean) {
    if (showLoader) {
      this.isLoading.set(true);
    }

    try {
      const [summary, posts, events, products, orders] = await Promise.all([
        firstValueFrom(this.adminDataService.getDashboardSummary()),
        firstValueFrom(this.adminDataService.getPosts()),
        firstValueFrom(this.adminDataService.getEvents()),
        firstValueFrom(this.adminDataService.getProducts()),
        firstValueFrom(this.adminDataService.getOrders()),
      ]);

      this.dashboardStats.set({
        totalPosts: summary.totalPosts || 0,
        totalEvents: summary.totalEvents || 0,
        totalProducts: summary.totalProducts || 0,
        totalRevenue: summary.totalRevenue || 0,
        recentActivity: Array.isArray(summary.recentActivity) ? summary.recentActivity : [],
      });

      this.posts.set(posts || []);
      this.events.set(events || []);
      this.products.set(products || []);
      this.orders.set(orders || []);
    } catch (error) {
      console.error('Failed to load admin dashboard data:', error);
      if (showLoader) {
        this.messageService.add({
          severity: 'error',
          summary: 'Dashboard Error',
          detail: 'Failed to load live dashboard data.',
        });
      }
    }

    await this.loadUsers();
    this.loadMediaFiles();

    if (showLoader) {
      this.isLoading.set(false);
    }
  }

  private startLiveRefresh() {
    if (this.liveRefreshTimer) return;
    this.liveRefreshTimer = setInterval(() => {
      this.fetchAdminData(false);
    }, 30000);
  }

  private stopLiveRefresh() {
    if (!this.liveRefreshTimer) return;
    clearInterval(this.liveRefreshTimer);
    this.liveRefreshTimer = undefined;
  }

  async loadUsers() {
    try {
      const response = await firstValueFrom(this.authService.getAllUsers());
      if (response?.users) {
        this.users.set(response.users.map(u => ({
          id: u.id.toString(),
          name: u.name,
          email: u.email,
          status: (u.verificationStatus === 'rejected' ? 'banned' : u.verificationStatus === 'pending' ? 'inactive' : 'active'),
          verificationStatus: u.verificationStatus || 'approved',
          verificationNote: u.verificationNote,
          joined_at: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
          role: u.role
        })));
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load users' });
    }
  }

  loadMediaFiles() {
    try {
      this.mediaService.getAllMedia().subscribe({
        next: (files) => {
          this.mediaFiles.set(files);
        },
        error: (error) => {
          console.error('Failed to load media files:', error);
        }
      });
    } catch (error) {
      console.error('Failed to load media files:', error);
    }
  }

  // UI methods
  toggleSidebar() {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
  }

  toggleProfile() {
    this.profileExpanded.set(!this.profileExpanded());
  }

  toggleTheme() {
    this.currentTheme.set(this.currentTheme() === 'light' ? 'dark' : 'light');
  }

  setTab(tab: AdminTab) {
    this.activeTab.set(tab);
    this.activeListFilter.set(null);
    this.applyFormValidators(tab);
    this.formSubmitted.set(false);
    this.loadDataForTab(tab);
  }

  setTabWithFilter(tab: FilterableTab, filterKey: string) {
    this.activeTab.set(tab);
    this.activeListFilter.set({
      tab,
      key: filterKey,
      label: this.getFilterLabel(tab, filterKey),
    });
    this.applyFormValidators(tab);
    this.formSubmitted.set(false);
    this.loadDataForTab(tab);
  }

  clearListFilter() {
    this.activeListFilter.set(null);
  }

  activeFilterLabelForTab(tab: FilterableTab): string | null {
    const activeFilter = this.activeListFilter();
    if (!activeFilter || activeFilter.tab !== tab) return null;
    return activeFilter.label;
  }

  private loadDataForTab(tab: AdminTab) {
    if (tab === 'users') {
      this.loadUsers();
      return;
    }
    if (tab === 'media') {
      this.loadMediaFiles();
      return;
    }
    if (tab === 'dashboard' || tab === 'posts' || tab === 'events' || tab === 'products' || tab === 'orders') {
      this.fetchAdminData(false);
    }
  }

  private getFilterLabel(tab: FilterableTab, filterKey: string): string {
    const labels: Record<FilterableTab, Record<string, string>> = {
      posts: {
        published: 'Published Posts',
        draft: 'Draft Posts',
        archived: 'Archived Posts',
      },
      users: {
        active: 'Active Users',
        inactive: 'Inactive Users',
        banned: 'Banned Users',
      },
      events: {
        upcoming: 'Upcoming Events',
        active: 'Active Events',
        inactive: 'Inactive Events',
      },
      products: {
        available: 'Available Products',
        out_of_stock: 'Out of Stock Products',
        discontinued: 'Discontinued Products',
      },
      orders: {
        pending: 'Pending Orders',
        processing: 'Processing Orders',
        shipped: 'Shipped Orders',
        delivered: 'Delivered Orders',
        canceled: 'Canceled Orders',
      },
    };
    return labels[tab]?.[filterKey] || `${tab} (${filterKey})`;
  }

  displayedPosts(): Post[] {
    const posts = this.posts();
    const activeFilter = this.activeListFilter();
    if (!activeFilter || activeFilter.tab !== 'posts') return posts;

    return posts.filter((post) => {
      if (activeFilter.key === 'published') return post.status === 'published';
      if (activeFilter.key === 'draft') return post.status === 'draft';
      if (activeFilter.key === 'archived') return post.status === 'archived';
      return true;
    });
  }

  displayedUsers(): User[] {
    const users = this.users();
    const activeFilter = this.activeListFilter();
    if (!activeFilter || activeFilter.tab !== 'users') return users;
    return users.filter((user) => user.status === activeFilter.key);
  }

  displayedEvents(): Event[] {
    const events = this.events();
    const activeFilter = this.activeListFilter();
    if (!activeFilter || activeFilter.tab !== 'events') return events;

    return events.filter((event) => {
      if (activeFilter.key === 'upcoming') {
        const eventDate = new Date(event.date);
        return !Number.isNaN(eventDate.getTime()) && eventDate >= new Date();
      }
      if (activeFilter.key === 'active') return event.status === 'active';
      if (activeFilter.key === 'inactive') return event.status === 'inactive';
      return true;
    });
  }

  displayedProducts(): Product[] {
    const products = this.products();
    const activeFilter = this.activeListFilter();
    if (!activeFilter || activeFilter.tab !== 'products') return products;
    return products.filter((product) => product.status === activeFilter.key);
  }

  displayedOrders(): Order[] {
    const orders = this.orders();
    const activeFilter = this.activeListFilter();
    if (!activeFilter || activeFilter.tab !== 'orders') return orders;
    return orders.filter((order) => order.status === activeFilter.key);
  }

  getPublishedPostsCount(): number {
    return this.posts().filter((post) => post.status === 'published').length;
  }

  getDraftPostsCount(): number {
    return this.posts().filter((post) => post.status === 'draft').length;
  }

  getActiveUsersCount(): number {
    return this.users().filter((user) => user.status === 'active').length;
  }

  getUpcomingEventsThisWeek(): number {
    const now = new Date();
    const weekFromNow = new Date(now);
    weekFromNow.setDate(now.getDate() + 7);
    return this.events().filter((event) => {
      const eventDate = new Date(event.date);
      return !Number.isNaN(eventDate.getTime()) && eventDate >= now && eventDate <= weekFromNow;
    }).length;
  }

  getUpcomingEventsThisMonth(): number {
    const now = new Date();
    const monthFromNow = new Date(now);
    monthFromNow.setMonth(now.getMonth() + 1);
    return this.events().filter((event) => {
      const eventDate = new Date(event.date);
      return !Number.isNaN(eventDate.getTime()) && eventDate >= now && eventDate <= monthFromNow;
    }).length;
  }

  getDeliveredOrdersCount(): number {
    return this.orders().filter((order) => order.status === 'delivered').length;
  }

  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      post: '📝',
      event: '📅',
      user: '👤',
      order: '📦'
    };
    return icons[type] || '📄';
  }

  // CRUD methods
  onSearch() {
    // Implement search logic
    console.log('Searching for:', this.searchQuery());
  }

  createItem() {
    this.editingItem.set(null);
    this.resetFormForCurrentTab();
    this.applyFormValidators(this.activeTab());
    this.formSubmitted.set(false);
    this.showCreateModal.set(true);
  }

  editItem(item: any) {
    this.editingItem.set(item);
    this.patchFormForEditItem(item);
    this.applyFormValidators(this.activeTab());
    this.formSubmitted.set(false);
    this.showCreateModal.set(true);
  }

  async setUserVerification(user: User, status: 'pending' | 'approved' | 'rejected') {
    try {
      await firstValueFrom(this.authService.updateUserVerification(user.id, status));
      this.messageService.add({
        severity: 'success',
        summary: 'Verification Updated',
        detail: `${user.email} is now ${status}.`,
      });
      await this.loadUsers();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Verification Failed',
        detail: error?.error?.message || error?.message || 'Could not update user verification.',
      });
    }
  }

  async deleteItem(item: any) {
    const tab = this.activeTab();
    const itemName = item?.title || item?.name || item?.id || 'this item';
    const confirmed = await this.confirmAction(`Delete ${itemName}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await this.deleteItemByTab(tab, item);
      this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Item deleted successfully' });
      await this.refreshActiveTabData();
    } catch (error: any) {
      console.error('Delete failed:', error);
      this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: error?.message || 'Unable to delete item' });
    }
  }

  async bulkDelete() {
    const ids = this.selectedItems();
    if (!ids.length) return;

    const confirmed = await this.confirmAction(`Delete ${ids.length} selected item(s)?`);
    if (!confirmed) return;

    const currentItems = this.getCurrentItems();
    const targetItems = currentItems.filter((item) => ids.includes(item.id));

    try {
      for (const item of targetItems) {
        await this.deleteItemByTab(this.activeTab(), item);
      }
      this.messageService.add({ severity: 'success', summary: 'Deleted', detail: `${targetItems.length} item(s) deleted` });
      await this.refreshActiveTabData();
    } catch (error: any) {
      console.error('Bulk delete failed:', error);
      this.messageService.add({ severity: 'error', summary: 'Bulk Delete Failed', detail: error?.message || 'Failed to delete selected items' });
    }

    this.selectedItems.set([]);
  }

  private async deleteItemByTab(tab: string, item: any) {
    switch (tab) {
      case 'posts':
        await firstValueFrom(this.adminDataService.deletePost(item.id));
        return;
      case 'events':
        await firstValueFrom(this.adminDataService.deleteEvent(item.id));
        return;
      case 'products':
        await firstValueFrom(this.adminDataService.deleteProduct(item.id));
        return;
      case 'orders':
        await firstValueFrom(this.adminDataService.deleteOrder(item.id));
        return;
      case 'users':
        await firstValueFrom(this.authService.deleteUser(String(item.id)));
        return;
      default:
        throw new Error(`Delete is not supported for tab "${tab}"`);
    }
  }

  toggleSelectAll() {
    const allItems = this.getCurrentItems();
    const allIds = allItems.map(item => item.id);
    const selected = this.selectedItems();

    if (selected.length === allItems.length) {
      this.selectedItems.set([]);
    } else {
      this.selectedItems.set(allIds);
    }
  }

  toggleSelectItem(id: string) {
    const selected = this.selectedItems();
    if (selected.includes(id)) {
      this.selectedItems.set(selected.filter(item => item !== id));
    } else {
      this.selectedItems.set([...selected, id]);
    }
  }

  private getCurrentItems(): any[] {
    switch (this.activeTab()) {
      case 'posts': return this.displayedPosts();
      case 'events': return this.displayedEvents();
      case 'products': return this.displayedProducts();
      case 'orders': return this.displayedOrders();
      case 'users': return this.displayedUsers();
      default: return [];
    }
  }

  // Utility methods
  private normalizeEventDate(value: string): string {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString();
  }

  private toDateTimeLocalValue(value: string | null | undefined): string {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    const localDate = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      active: 'success',
      inactive: 'warning',
      draft: 'secondary',
      published: 'success',
      archived: 'secondary',
      available: 'success',
      out_of_stock: 'danger',
      discontinued: 'secondary',
      pending: 'warning',
      processing: 'info',
      shipped: 'primary',
      delivered: 'success',
      canceled: 'danger',
      banned: 'danger'
    };
    return colors[status] || 'secondary';
  }

  // Media methods
  filterByCategory(category: 'all' | 'images' | 'videos' | 'documents') {
    this.mediaCategory.set(category);
  }

  filteredMediaFiles(): MediaFile[] {
    const category = this.mediaCategory();
    const files = this.mediaFiles();

    if (category === 'all') return files;

    switch (category) {
      case 'images':
        return files.filter(file => file.mimetype.startsWith('image/'));
      case 'videos':
        return files.filter(file => file.mimetype.startsWith('video/'));
      case 'documents':
        return files.filter(file => !file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/'));
      default:
        return files;
    }
  }

  onFileSelected(event: any) {
    const files = (event?.files as File[]) || Array.from(event?.target?.files || []);
    if (files && files.length > 0) {
      this.uploadFiles(files);
    }
  }

  uploadFiles(files: File[] | FileList) {
    this.isUploading.set(true);
    this.uploadProgress.set(0);

    const normalizedFiles = Array.from(files as FileList | File[]) as File[];
    const totalFiles = normalizedFiles.length;
    let completedUploads = 0;

    normalizedFiles.forEach((file) => {
      try {
        this.mediaService.uploadFile(file).subscribe({
          next: (uploadedFile) => {
            console.log('File uploaded:', uploadedFile);
            completedUploads += 1;
            this.uploadProgress.set(Math.round((completedUploads / totalFiles) * 100));
            this.loadMediaFiles();
            if (completedUploads >= totalFiles) {
              this.isUploading.set(false);
              this.uploadProgress.set(0);
            }
          },
          error: (error) => {
            console.error('Upload failed:', error);
            this.isUploading.set(false);
            this.uploadProgress.set(0);
          }
        });
      } catch (error) {
        console.error('Upload failed:', error);
        this.isUploading.set(false);
        this.uploadProgress.set(0);
      }
    });
  }

  getFileIcon(type: string): string {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    return '📄';
  }

  playMedia(file: MediaFile) {
    // Implement media preview
    console.log('Playing media:', file);
  }

  deleteMedia(file: MediaFile) {
    this.confirmAction(`Delete media file "${file.filename}"?`).then((confirmed) => {
      if (!confirmed) return;

      firstValueFrom(this.mediaService.deleteMedia(file.id))
        .then(() => {
          this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Media file removed' });
          this.loadMediaFiles();
        })
        .catch((error) => {
          console.error('Failed to delete media:', error);
          this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete media file' });
        });
    });
  }

  // New methods for PrimeNG template
  // Dashboard specific methods
  setChartPeriod(period: '7d' | '30d' | '90d') {
    console.log('Setting chart period:', period);
    // Implement chart period logic
  }

  getActivityColor(type: string): string {
    const colors: { [key: string]: string } = {
      post: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      event: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      user: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      order: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    };
    return colors[type] || 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
  }

  formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return this.formatDate(timestamp);
  }

  showActivityMenu(event: PointerEvent | Event, activity: any) {
    console.log('Showing activity menu for:', activity);
    // Implement activity menu logic
  }

  getPageTitle(): string {
    const titles: { [key: string]: string } = {
      dashboard: 'Dashboard',
      posts: 'Posts Management',
      events: 'Events Management',
      products: 'Products Management',
      orders: 'Orders Management',
      users: 'Users Management',
      media: 'Media Library',
      settings: 'Settings'
    };
    return titles[this.activeTab()] || 'Dashboard';
  }

  getModalTitle(): string {
    const labels: { [key: string]: string } = {
      posts: 'Post',
      events: 'Event',
      products: 'Product',
      orders: 'Order',
      users: 'User',
    };
    const noun = labels[this.activeTab()] || 'Item';
    return this.editingItem() ? `Edit ${noun}` : `Create ${noun}`;
  }

  async saveItem() {
    if (!this.itemForm) return;

    const tab = this.activeTab();
    this.formSubmitted.set(true);
    this.applyFormValidators(tab);
    this.itemForm.markAllAsTouched();

    if (!this.itemForm.valid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fix the highlighted form fields.',
      });
      return;
    }

    const editing = this.editingItem();
    const form = this.itemForm.value as any;

    try {
      switch (tab) {
        case 'posts': {
          const payload = {
            title: String(form.title || '').trim(),
            content: String(form.content || '').trim(),
            slug: String(form.slug || '').trim() || undefined,
            published: String(form.status || 'draft').toLowerCase() === 'published',
          };
          if (!payload.title || !payload.content) {
            throw new Error('Post title and content are required');
          }
          if (editing?.id) {
            await firstValueFrom(this.adminDataService.updatePost(editing.id, payload));
          } else {
            await firstValueFrom(this.adminDataService.createPost(payload));
          }
          break;
        }

        case 'events': {
          const rawDate = String(form.date || '').trim();
          const payload = {
            title: String(form.title || '').trim(),
            date: this.normalizeEventDate(rawDate),
            location: String(form.location || '').trim() || undefined,
            attendees: Number(form.attendees || 0),
            status: String(form.status || 'draft').toLowerCase() as Event['status'],
            description: String(form.description || '').trim() || undefined,
          };
          if (!payload.title || !payload.date || Number.isNaN(new Date(payload.date).getTime())) {
            throw new Error('Event title and a valid date are required');
          }
          if (editing?.id) {
            await firstValueFrom(this.adminDataService.updateEvent(editing.id, payload));
          } else {
            await firstValueFrom(this.adminDataService.createEvent(payload));
          }
          break;
        }

        case 'products': {
          const payload = {
            name: String(form.title || '').trim(),
            price: Number(form.price || 0),
            stock: Number(form.stock || 0),
            category: String(form.category || 'General').trim() || 'General',
            status: String(form.status || 'available').toLowerCase() as Product['status'],
            description: String(form.description || '').trim() || undefined,
          };
          if (!payload.name || !Number.isFinite(payload.price) || payload.price <= 0) {
            throw new Error('Product name and valid price are required');
          }
          if (editing?.id) {
            await firstValueFrom(this.adminDataService.updateProduct(editing.id, payload));
          } else {
            await firstValueFrom(this.adminDataService.createProduct(payload));
          }
          break;
        }

        case 'orders': {
          if (!editing?.id) {
            throw new Error('Orders can only be edited');
          }
          const payload = {
            total: Number(form.total || editing.total || 0),
            status: String(form.status || editing.status || 'pending').toLowerCase() as Order['status'],
          };
          if (!Number.isFinite(payload.total) || payload.total <= 0) {
            throw new Error('Order total must be greater than 0');
          }
          await firstValueFrom(this.adminDataService.updateOrder(editing.id, payload));
          break;
        }

        case 'users': {
          const email = String(form.email || '').trim();
          const name = String(form.title || '').trim();
          const role = String(form.role || 'user').trim();
          if (!email || !name) {
            throw new Error('User name and email are required');
          }
          if (editing?.id) {
            await firstValueFrom(
              this.authService.updateUser(String(editing.id), { email, name, role }),
            );
          } else {
            await firstValueFrom(this.authService.createUser(email, name, role));
          }
          break;
        }

        default:
          throw new Error(`Save is not supported for "${tab}"`);
      }

      this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Changes saved successfully' });
      this.showCreateModal.set(false);
      this.editingItem.set(null);
      this.formSubmitted.set(false);
      this.resetFormForCurrentTab();
      await this.refreshActiveTabData();
    } catch (error: any) {
      console.error('Save failed:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Save Failed',
        detail: error?.message || 'Failed to save item',
      });
    }
  }

  private resetFormForCurrentTab() {
    const tab = this.activeTab();
    const defaultStatus =
      tab === 'products' ? 'available' : tab === 'orders' ? 'pending' : 'draft';

    this.itemForm.reset({
      title: '',
      content: '',
      slug: '',
      email: '',
      role: 'user',
      date: '',
      location: '',
      attendees: 0,
      status: defaultStatus,
      price: '',
      stock: 0,
      category: 'General',
      description: '',
      total: '',
    });
    this.applyFormValidators(tab);
    this.formSubmitted.set(false);
    this.itemForm.markAsPristine();
    this.itemForm.markAsUntouched();
  }

  closeModal() {
    this.showCreateModal.set(false);
    this.editingItem.set(null);
    this.formSubmitted.set(false);
    this.resetFormForCurrentTab();
  }

  private patchFormForEditItem(item: any) {
    this.resetFormForCurrentTab();
    const tab = this.activeTab();

    if (tab === 'posts') {
      this.itemForm.patchValue({
        title: item?.title || '',
        content: item?.content || '',
        slug: item?.slug || '',
        status: item?.status || 'draft',
      });
      return;
    }

    if (tab === 'events') {
      this.itemForm.patchValue({
        title: item?.title || '',
        date: this.toDateTimeLocalValue(item?.date),
        location: item?.location || '',
        attendees: item?.attendees || 0,
        status: item?.status || 'draft',
        description: item?.description || '',
      });
      return;
    }

    if (tab === 'products') {
      this.itemForm.patchValue({
        title: item?.name || '',
        price: item?.price || '',
        stock: item?.stock || 0,
        category: item?.category || 'General',
        status: item?.status || 'available',
        description: item?.description || '',
      });
      return;
    }

    if (tab === 'orders') {
      this.itemForm.patchValue({
        total: item?.total || '',
        status: item?.status || 'pending',
      });
      return;
    }

    if (tab === 'users') {
      this.itemForm.patchValue({
        title: item?.name || '',
        email: item?.email || '',
        role: item?.role || 'user',
      });
    }
  }

  private async refreshActiveTabData() {
    const tab = this.activeTab();
    if (tab === 'users') {
      await this.loadUsers();
      return;
    }
    if (tab === 'media') {
      this.loadMediaFiles();
      return;
    }
    await this.fetchAdminData(false);
  }

  viewOrder(order: Order) {
    console.log('Viewing order:', order);
  }

  downloadFile(file: MediaFile) {
    if (typeof window === 'undefined') return;
    const anchor = document.createElement('a');
    anchor.href = file.url;
    anchor.download = file.originalName || file.filename;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.click();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getActivityIconClass(type: string): string {
    const icons: { [key: string]: string } = {
      post: 'pi pi-file-text',
      event: 'pi pi-calendar',
      user: 'pi pi-user',
      order: 'pi pi-shopping-cart'
    };
    return icons[type] || 'pi pi-info-circle';
  }

  getFileIconClass(type: string): string {
    if (type.startsWith('image/')) return 'pi pi-image';
    if (type.startsWith('video/')) return 'pi pi-video';
    if (type.startsWith('audio/')) return 'pi pi-volume-up';
    return 'pi pi-file';
  }

  getStatusSeverity(status: string): "secondary" | "info" | "success" | "warn" | "danger" | "contrast" {
    const severities: { [key: string]: "secondary" | "info" | "success" | "warn" | "danger" | "contrast" } = {
      active: 'success',
      inactive: 'warn',
      approved: 'success',
      rejected: 'danger',
      draft: 'secondary',
      published: 'success',
      archived: 'secondary',
      available: 'success',
      out_of_stock: 'danger',
      discontinued: 'secondary',
      pending: 'warn',
      processing: 'info',
      shipped: 'contrast',
      delivered: 'success',
      canceled: 'danger',
      banned: 'danger'
    };
    return severities[status] || 'secondary';
  }

  getMediaFilterLabel(category: string): string {
    const files = this.mediaFiles();
    let count = 0;

    switch (category) {
      case 'all':
        count = files.length;
        break;
      case 'images':
        count = files.filter(f => f.mimetype.startsWith('image/')).length;
        break;
      case 'videos':
        count = files.filter(f => f.mimetype.startsWith('video/')).length;
        break;
      case 'documents':
        count = files.filter(f => !f.mimetype.startsWith('image/') && !f.mimetype.startsWith('video/')).length;
        break;
    }

    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    return `${categoryName} (${count})`;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private confirmAction(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmationService.confirm({
        message,
        header: 'Confirm Action',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Yes',
        rejectLabel: 'No',
        accept: () => resolve(true),
        reject: () => resolve(false),
      });
    });
  }

  ngOnDestroy() {
    this.stopLiveRefresh();
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
