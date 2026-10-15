import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Personal pages: rendered only in the visitor's browser, never on a server or at build time.
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: 'store/orders/:number', renderMode: RenderMode.Client },
  {
    path: 'articles',
    renderMode: RenderMode.Server
  },
  {
    path: 'articles/:slug',
    renderMode: RenderMode.Server
  },
  {
    path: 'about/team/:slug',
    renderMode: RenderMode.Server
  },
  {
    path: 'home/:level/:programSlug',
    renderMode: RenderMode.Server
  },
  {
    path: 'home/:programSlug',
    renderMode: RenderMode.Server
  },
  {
    path: 'home/:level',
    renderMode: RenderMode.Server
  },
  {
    path: 'programmes/:level/:programSlug',
    renderMode: RenderMode.Server
  },
  {
    path: 'programmes/:programSlug',
    renderMode: RenderMode.Server
  },
  {
    path: 'programmes/:level',
    renderMode: RenderMode.Server
  },
  {
    path: 'programs/:level/:programSlug',
    renderMode: RenderMode.Server
  },
  {
    path: 'programs/:programSlug',
    renderMode: RenderMode.Server
  },
  {
    path: 'programs/:level',
    renderMode: RenderMode.Server
  },
  {
    path: ':level-programmes/:programSlug',
    renderMode: RenderMode.Server
  },
  {
    path: 'faculties-schools/:slug',
    renderMode: RenderMode.Server
  },
  {
    path: 'academics/colleges/:slug/schools/:schoolSlug/departments/:departmentSlug',
    renderMode: RenderMode.Server
  },
  {
    path: 'academics/colleges/:slug/schools/:schoolSlug',
    renderMode: RenderMode.Server
  },
  {
    path: 'academics/colleges/:slug',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
