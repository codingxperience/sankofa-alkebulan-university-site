import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { HomeComponent } from './pages/home.component';
import { AboutPageComponent } from './pages/about-page.component';
import { AboutDetailPageComponent } from './pages/about-detail-page.component';
import { TeamCategoryPageComponent } from './pages/team-category-page.component';
import { TeamProfilePageComponent } from './pages/team-profile-page.component';
import { DepartmentPageComponent } from './pages/department-page.component';
import { ProgrammesLevelComponent } from './pages/programmes-level.component';
import { ProgramDetailComponent } from './pages/program-detail.component';
import { EssayDetailComponent } from './pages/essay-detail.component';
import { MembershipComponent } from './pages/membership.component';
import { ShopComponent } from './pages/shop.component';
import { LibraryComponent } from './pages/library.component';
import { Articles } from './pages/articles/articles';
import { Admin } from './pages/admin/admin';
import { Login } from './login/login';
import { Register } from './register/register';
import { AdminLogin } from './admin-login/admin-login';
import { Payment } from './payment/payment';
import { CartComponent } from './cart/cart';
import { authGuard, adminGuard } from './auth-guard';
import { UniversitySectionPageComponent } from './pages/university-section-page.component';
import { UNIVERSITY_PORTAL_PAGES } from './university/university-data';

const universitySectionRoutes: Routes = UNIVERSITY_PORTAL_PAGES.map((section) => ({
  path: section.path,
  component: UniversitySectionPageComponent,
  data: { slug: section.slug },
}));

const departmentShortcutRoutes: Routes = [
  {
    path: 'home/school-of-business-economics-and-entrepreneurship',
    component: DepartmentPageComponent,
    data: { slug: 'school-of-business-economics-and-entrepreneurship' },
  },
  {
    path: 'home/Business School',
    component: DepartmentPageComponent,
    data: { slug: 'school-of-business-economics-and-entrepreneurship' },
  },
  {
    path: 'home/graduate-school',
    component: DepartmentPageComponent,
    data: { slug: 'graduate-school' },
  },
  {
    path: 'home/Graduate School',
    component: DepartmentPageComponent,
    data: { slug: 'graduate-school' },
  },
  {
    path: 'home/school-of-education',
    component: DepartmentPageComponent,
    data: { slug: 'school-of-education' },
  },
  {
    path: 'home/School of Education',
    component: DepartmentPageComponent,
    data: { slug: 'school-of-education' },
  },
  {
    path: 'home/school-of-engineering-and-applied-technologies',
    component: DepartmentPageComponent,
    data: { slug: 'school-of-engineering-and-applied-technologies' },
  },
  {
    path: 'home/School of Technology, Computing & Engineering',
    component: DepartmentPageComponent,
    data: { slug: 'school-of-engineering-and-applied-technologies' },
  },
  {
    path: 'home/school-of-law-and-human-rights',
    component: DepartmentPageComponent,
    data: { slug: 'school-of-law-and-human-rights' },
  },
  {
    path: 'home/Law School',
    component: DepartmentPageComponent,
    data: { slug: 'school-of-law-and-human-rights' },
  },
  {
    path: 'home/institute-of-public-health-and-health-sciences',
    component: DepartmentPageComponent,
    data: { slug: 'institute-of-public-health-and-health-sciences' },
  },
  {
    path: 'home/Institute of Public Health & Health Sciences',
    component: DepartmentPageComponent,
    data: { slug: 'institute-of-public-health-and-health-sciences' },
  },
  {
    path: 'home/institute-of-african-culture-science-and-technology-iacst',
    component: DepartmentPageComponent,
    data: { slug: 'institute-of-african-culture-science-and-technology-iacst' },
  },
  {
    path: 'home/Institute of African Culture, Science and Technology (IACST)',
    component: DepartmentPageComponent,
    data: { slug: 'institute-of-african-culture-science-and-technology-iacst' },
  },
];

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: 'admin-login',
    component: AdminLogin
  },
  {
    path: 'register',
    component: Register
  },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: '/home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'about', component: AboutPageComponent },
      { path: 'about/executive-team', component: TeamCategoryPageComponent, data: { categoryId: 'executive' } },
      { path: 'about/board-of-governance', component: TeamCategoryPageComponent, data: { categoryId: 'board' } },
      { path: 'about/advisory-council', component: TeamCategoryPageComponent, data: { categoryId: 'advisory' } },
      { path: 'about/research-scholarly-team', component: TeamCategoryPageComponent, data: { categoryId: 'research-scholarly' } },
      { path: 'about/team/:slug', component: TeamProfilePageComponent },
      { path: 'about/:slug', component: AboutDetailPageComponent },
      { path: 'student-life', redirectTo: '/home', pathMatch: 'full' },
      { path: 'faculty-staff', redirectTo: '/home', pathMatch: 'full' },
      { path: 'digital-learning', redirectTo: '/home', pathMatch: 'full' },
      { path: 'media-public-scholarship', redirectTo: '/home', pathMatch: 'full' },
      { path: 'institutional-development', redirectTo: '/home', pathMatch: 'full' },
      ...departmentShortcutRoutes,
      { path: 'home/:level/:programSlug', component: ProgramDetailComponent },
      { path: 'home/:level', component: ProgrammesLevelComponent },
      { path: 'home/:programSlug', component: ProgramDetailComponent },
      { path: 'programmes/:level/:programSlug', component: ProgramDetailComponent },
      { path: 'programs/:level/:programSlug', component: ProgramDetailComponent },
      { path: 'programmes/:programSlug', component: ProgramDetailComponent },
      { path: 'programs/:programSlug', component: ProgramDetailComponent },
      { path: ':level-programmes/:programSlug', component: ProgramDetailComponent },
      { path: 'programmes', redirectTo: '/home/bachelors', pathMatch: 'full' },
      { path: 'programmes/:level', component: ProgrammesLevelComponent },
      { path: 'programs/:level', component: ProgrammesLevelComponent },
      { path: 'phd', redirectTo: '/home/phd', pathMatch: 'full' },
      { path: 'masters', redirectTo: '/home/masters', pathMatch: 'full' },
      { path: 'postgraduate-diploma', redirectTo: '/home/postgraduate-diploma', pathMatch: 'full' },
      { path: 'bachelors', redirectTo: '/home/bachelors', pathMatch: 'full' },
      { path: 'diploma', redirectTo: '/home/diploma', pathMatch: 'full' },
      { path: 'certificate', redirectTo: '/home/certificate', pathMatch: 'full' },
      { path: 'faculties-schools/:slug', component: DepartmentPageComponent },
      ...universitySectionRoutes,
      { path: 'articles', component: Articles },
      { path: 'articles/:slug', component: EssayDetailComponent },
      { path: 'essays', redirectTo: '/articles', pathMatch: 'full' },
      { path: 'blog', redirectTo: '/articles', pathMatch: 'full' },
      { path: 'membership', component: MembershipComponent },
      { path: 'shop', component: ShopComponent },
      { path: 'library', redirectTo: '/library-repository', pathMatch: 'full' },
      { path: 'legacy-library', component: LibraryComponent },
      { path: 'community', redirectTo: '/membership', pathMatch: 'full' },
      { path: 'workshops', redirectTo: '/library-repository', pathMatch: 'full' },
      { path: 'payment', component: Payment, canActivate: [authGuard] },
      { path: 'cart', component: CartComponent },
    ]
  },
  {
    path: 'admin',
    component: Admin,
    canActivate: [adminGuard]
  },
  {
    path: 'admin-dashboard',
    redirectTo: '/admin',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/home',
    pathMatch: 'full',
  },
];
