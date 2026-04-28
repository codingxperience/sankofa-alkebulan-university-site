import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
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
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
