import { Routes } from '@angular/router';
import { LinkPage } from './auth/link-page';
import { SignIn } from './auth/sign-in';
import { ConsoleRoot } from './console-root';
import { allowed, signedIn, signedOut } from './core/guards';
import { Shell } from './shell/shell';

const title = (page: string) => `${page} · Sankofa Console`;

/**
 * The console. Sign-in screens and the frame load with this file; each
 * screen inside the frame is its own chunk, fetched when first opened.
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: ConsoleRoot,
    children: [
      { path: 'sign-in', component: SignIn, canActivate: [signedOut], title: title('Sign in') },
      { path: 'welcome', component: LinkPage, data: { purpose: 'invitation' }, title: title('Join') },
      { path: 'reset-password', component: LinkPage, data: { purpose: 'reset' }, title: title('New password') },
      {
        path: '',
        component: Shell,
        canActivate: [signedIn],
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () => import('./pages/workspace/workspace').then((m) => m.WorkspacePage),
            title: title('Workspace'),
          },
          {
            path: 'inbox',
            canActivate: [allowed('inquiries.read')],
            loadComponent: () => import('./pages/inbox/inbox').then((m) => m.InboxPage),
            title: title('Inbox'),
            children: [
              {
                path: ':id',
                loadComponent: () => import('./pages/inbox/inquiry').then((m) => m.InquiryPane),
              },
            ],
          },
          {
            path: 'admissions',
            canActivate: [allowed('applications.read')],
            loadComponent: () => import('./pages/admissions/applications').then((m) => m.ApplicationsPage),
            title: title('Admissions'),
          },
          {
            path: 'admissions/:id',
            canActivate: [allowed('applications.read')],
            loadComponent: () => import('./pages/admissions/application').then((m) => m.ApplicationPage),
            title: title('Application'),
          },
          {
            path: 'events',
            canActivate: [allowed('events.read')],
            loadComponent: () => import('./pages/events/events').then((m) => m.EventsPage),
            title: title('Events'),
          },
          {
            path: 'events/new',
            canActivate: [allowed('events.manage')],
            loadComponent: () => import('./pages/events/event-editor').then((m) => m.EventEditorPage),
            title: title('New event'),
          },
          {
            path: 'events/:id/edit',
            canActivate: [allowed('events.manage')],
            loadComponent: () => import('./pages/events/event-editor').then((m) => m.EventEditorPage),
            title: title('Edit event'),
          },
          {
            path: 'events/:id',
            canActivate: [allowed('events.read')],
            loadComponent: () => import('./pages/events/event').then((m) => m.EventPage),
            title: title('Event'),
          },
          { path: 'store', pathMatch: 'full', redirectTo: 'store/orders' },
          {
            path: 'store/orders',
            canActivate: [allowed('store.read')],
            loadComponent: () => import('./pages/store/orders').then((m) => m.OrdersPage),
            title: title('Orders'),
          },
          {
            path: 'store/orders/:id',
            canActivate: [allowed('store.read')],
            loadComponent: () => import('./pages/store/order').then((m) => m.OrderPage),
            title: title('Order'),
          },
          {
            path: 'store/products',
            canActivate: [allowed('store.read')],
            loadComponent: () => import('./pages/store/products').then((m) => m.ProductsPage),
            title: title('Products'),
          },
          {
            path: 'journal',
            canActivate: [allowed('journal.read')],
            loadComponent: () => import('./pages/journal/articles').then((m) => m.ArticlesPage),
            title: title('Journal'),
          },
          {
            path: 'journal/new',
            canActivate: [allowed('journal.manage')],
            loadComponent: () => import('./pages/journal/article-editor').then((m) => m.ArticleEditorPage),
            title: title('New article'),
          },
          {
            path: 'journal/:id',
            canActivate: [allowed('journal.read')],
            loadComponent: () => import('./pages/journal/article-editor').then((m) => m.ArticleEditorPage),
            title: title('Article'),
          },
          {
            path: 'audience',
            canActivate: [allowed('audience.read')],
            loadComponent: () => import('./pages/audience/audience').then((m) => m.AudiencePage),
            title: title('Mailing list'),
          },
          {
            path: 'team',
            canActivate: [allowed('staff.read')],
            loadComponent: () => import('./pages/team/team').then((m) => m.TeamPage),
            title: title('Team'),
          },
          {
            path: 'audit',
            canActivate: [allowed('audit.read')],
            loadComponent: () => import('./pages/audit/audit').then((m) => m.AuditPage),
            title: title('Audit log'),
          },
          {
            path: 'settings',
            loadComponent: () => import('./pages/settings/settings').then((m) => m.SettingsPage),
            title: title('Settings'),
          },
          {
            path: 'account',
            loadComponent: () => import('./pages/account/account').then((m) => m.AccountPage),
            title: title('Your account'),
          },
          { path: '**', redirectTo: '' },
        ],
      },
    ],
  },
];
