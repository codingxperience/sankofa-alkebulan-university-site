import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { HomeComponent } from './pages/home.component';
import { AboutPageComponent } from './pages/about-page.component';
import { AboutDetailPageComponent } from './pages/about-detail-page.component';
import { AcademicsPageComponent } from './pages/academics-page.component';
import { AcademicCollegeDetailPageComponent } from './pages/academic-college-detail-page.component';
import { AcademicDirectoryPageComponent } from './pages/academic-directory-page.component';
import { AcademicStructureDetailPageComponent } from './pages/academic-structure-detail-page.component';
import { AdmissionsApplyPageComponent } from './pages/admissions-apply-page.component';
import { DigitalLearningPageComponent } from './pages/digital-learning-page.component';
import { StudentLifePageComponent } from './pages/student-life-page.component';
import { StudentOrganizationsPageComponent } from './pages/student-organizations-page.component';
import { TeamCategoryPageComponent } from './pages/team-category-page.component';
import { TeamProfilePageComponent } from './pages/team-profile-page.component';
import { DepartmentPageComponent } from './pages/department-page.component';
import { ProgrammesLevelComponent } from './pages/programmes-level.component';
import { ProgramDetailComponent } from './pages/program-detail.component';
import { MembershipComponent } from './pages/membership.component';
import { ShopComponent } from './pages/shop.component';
import { LibraryComponent } from './pages/library.component';
import { PressPageComponent } from './pages/press-page.component';
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
  // The admin console is its own application, loaded only when someone opens it.
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  { path: 'admin-login', redirectTo: '/admin/sign-in', pathMatch: 'full' },
  { path: 'admin-dashboard', redirectTo: '/admin', pathMatch: 'full' },
  // Students sign in on the learning platform; applicants start on Admissions.
  { path: 'login', redirectTo: '/digital-learning', pathMatch: 'full' },
  { path: 'register', redirectTo: '/admissions', pathMatch: 'full' },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: '/home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'about', component: AboutPageComponent },
      { path: 'about/executive-team', component: TeamCategoryPageComponent, data: { categoryId: 'executive' } },
      { path: 'about/board-of-governance', component: TeamCategoryPageComponent, data: { categoryId: 'board' } },
      // The Advisory Council sits within the Board of Governance, the University Council is the Board by another
      // name, and the Research & Scholarly Team works under the Deputy Vice Chancellor for Research and Innovation.
      { path: 'about/advisory-council', redirectTo: '/about/board-of-governance', pathMatch: 'full' },
      { path: 'about/university-council', redirectTo: '/about/board-of-governance', pathMatch: 'full' },
      { path: 'about/research-scholarly-team', redirectTo: '/about/executive-team', pathMatch: 'full' },
      { path: 'about/team/:slug', component: TeamProfilePageComponent },
      { path: 'about/:slug', component: AboutDetailPageComponent },
      { path: 'academics', component: AcademicsPageComponent },
      { path: 'academics/colleges', component: AcademicDirectoryPageComponent, data: { mode: 'colleges' } },
      { path: 'academics/colleges/:slug/schools/:schoolSlug/departments/:departmentSlug', component: AcademicStructureDetailPageComponent },
      { path: 'academics/colleges/:slug/schools/:schoolSlug', component: AcademicStructureDetailPageComponent },
      { path: 'academics/colleges/:slug', component: AcademicCollegeDetailPageComponent },
      { path: 'academics/schools', component: AcademicDirectoryPageComponent, data: { mode: 'schools' } },
      { path: 'academics/departments', component: AcademicDirectoryPageComponent, data: { mode: 'departments' } },
      { path: 'academics/research-institutes', component: AcademicDirectoryPageComponent, data: { mode: 'research' } },
      { path: 'faculties-schools', component: AcademicDirectoryPageComponent, data: { mode: 'colleges' } },
      { path: 'admissions', component: AdmissionsApplyPageComponent },
      { path: 'apply', redirectTo: '/admissions', pathMatch: 'full' },
      { path: 'digital-learning', component: DigitalLearningPageComponent },
      { path: 'digital-campus', redirectTo: '/digital-learning', pathMatch: 'full' },
      { path: 'student-life', component: StudentLifePageComponent },
      { path: 'clubs-societies', component: StudentOrganizationsPageComponent },
      { path: 'student-organisations', redirectTo: '/clubs-societies', pathMatch: 'full' },
      { path: 'student-organizations', redirectTo: '/clubs-societies', pathMatch: 'full' },
      { path: 'professional-societies', component: StudentOrganizationsPageComponent, data: { system: 'professional' } },
      { path: 'cultural-societies', component: StudentOrganizationsPageComponent, data: { system: 'cultural' } },
      { path: 'press', component: PressPageComponent },
      { path: 'university-press', component: PressPageComponent },
      {
        path: 'convening/register',
        loadComponent: () =>
          import('./pages/convening-register-page.component').then(
            (m) => m.ConveningRegisterPageComponent,
          ),
      },
      {
        path: 'convening',
        loadComponent: () =>
          import('./pages/convening-page.component').then((m) => m.ConveningPageComponent),
      },
      { path: 'events/convening', redirectTo: '/convening', pathMatch: 'full' },
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
      {
        path: 'research-innovation',
        loadComponent: () =>
          import('./pages/research-page.component').then((m) => m.ResearchPageComponent),
      },
      { path: 'research', redirectTo: '/research-innovation', pathMatch: 'full' },
      {
        path: 'library-repository',
        loadComponent: () =>
          import('./pages/library-repository-page.component').then(
            (m) => m.LibraryRepositoryPageComponent,
          ),
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./pages/contact-page.component').then((m) => m.ContactPageComponent),
      },
      {
        path: 'store',
        loadComponent: () =>
          import('./pages/store-page.component').then((m) => m.StorePageComponent),
      },
      {
        path: 'store/orders/:number',
        loadComponent: () =>
          import('./pages/store-order-page.component').then((m) => m.StoreOrderPageComponent),
      },
      {
        path: 'career-link',
        loadComponent: () =>
          import('./pages/career-link-page.component').then((m) => m.CareerLinkPageComponent),
      },
      {
        path: 'knowledge-vault',
        loadComponent: () =>
          import('./pages/knowledge-vault-page.component').then(
            (m) => m.KnowledgeVaultPageComponent,
          ),
      },
      {
        path: 'kahigiriza',
        loadComponent: () =>
          import('./pages/kahigiriza-page.component').then((m) => m.KahigirizaPageComponent),
      },
      ...universitySectionRoutes,
      {
        path: 'articles',
        loadComponent: () => import('./pages/articles/articles').then((m) => m.Articles),
      },
      {
        path: 'articles/:slug',
        loadComponent: () =>
          import('./pages/essay-detail.component').then((m) => m.EssayDetailComponent),
      },
      { path: 'essays', redirectTo: '/articles', pathMatch: 'full' },
      { path: 'blog', redirectTo: '/articles', pathMatch: 'full' },
      { path: 'membership', component: MembershipComponent },
      { path: 'shop', component: ShopComponent },
      { path: 'library', redirectTo: '/library-repository', pathMatch: 'full' },
      { path: 'legacy-library', component: LibraryComponent },
      { path: 'community', redirectTo: '/membership', pathMatch: 'full' },
      { path: 'workshops', redirectTo: '/library-repository', pathMatch: 'full' },
      // Payments happen inside the store's checkout; there is no separate payment page.
      { path: 'payment', redirectTo: '/store', pathMatch: 'full' },
      { path: 'cart', redirectTo: '/store', pathMatch: 'full' },
    ]
  },
  {
    path: '**',
    redirectTo: '/home',
    pathMatch: 'full',
  },
];
