/**
 * Shapes the console receives from /api/admin. They mirror the server's
 * responses field for field; dates arrive as ISO strings.
 */

export type Permission =
  | 'overview.read'
  | 'inquiries.read'
  | 'inquiries.manage'
  | 'applications.read'
  | 'applications.manage'
  | 'events.read'
  | 'events.manage'
  | 'store.read'
  | 'store.manage'
  | 'journal.read'
  | 'journal.manage'
  | 'audience.read'
  | 'audience.export'
  | 'staff.read'
  | 'staff.manage'
  | 'audit.read'
  | 'settings.manage';

export type StaffRole = 'OWNER' | 'ADMIN' | 'ADMISSIONS' | 'COMMUNICATIONS' | 'EVENTS' | 'COMMERCE' | 'VIEWER';
export type StaffStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED';
export type Office = 'ADMISSIONS' | 'PROGRAMMES' | 'RESEARCH' | 'STUDENT_LIFE' | 'GOVERNANCE' | 'MEDIA' | 'CENTRAL';

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface Me {
  id: string;
  email: string;
  name: string;
  title: string | null;
  roles: StaffRole[];
  roleLabels: string[];
  offices: Office[];
  permissions: Permission[];
}

export interface PersonRef {
  id: string;
  name: string;
}

export interface Activity {
  id: string;
  actorLabel: string;
  action: string;
  summary: string;
  createdAt: string;
}

export interface Note {
  id: string;
  body: string;
  kind?: 'NOTE' | 'REPLY';
  createdAt: string;
  author: PersonRef | null;
}

// ─── Overview ───────────────────────────────────────────────────────────

export type DaybookKind = 'inquiry' | 'application' | 'registration' | 'order';

export interface Overview {
  inquiries: {
    new: number;
    active: number;
    oldestWaiting: Array<{ id: string; reference: string; name: string; subject: string | null; office: Office; createdAt: string }>;
  } | null;
  applications: { awaitingDecision: number; inProgress: number; submitted30d: number } | null;
  events: {
    upcoming: Array<{ id: string; title: string; startsAt: string; timezone: string; capacity: number | null; confirmed: number }>;
  } | null;
  store: { awaitingPayment: number; toFulfil: number; revenue30dCents: number } | null;
  subscribers: number | null;
  activity: { days: string[]; series: Partial<Record<DaybookKind, number[]>> };
}

export interface DaybookEntry {
  kind: DaybookKind;
  id: string;
  at: string;
  ref: string;
  who: string | null;
  title: string | null;
  detail: string | null;
  status: string;
  parent: string | null;
}

// ─── Inquiries ──────────────────────────────────────────────────────────

export type InquiryStatus = 'NEW' | 'OPEN' | 'AWAITING_REPLY' | 'RESOLVED' | 'SPAM';

export interface InquirySummary {
  id: string;
  reference: string;
  office: Office;
  source: string;
  status: InquiryStatus;
  name: string;
  email: string;
  subject: string | null;
  preview: string;
  assignee: PersonRef | null;
  notes: number;
  createdAt: string;
  updatedAt: string;
}

export interface InquiryDetail {
  id: string;
  reference: string;
  office: Office;
  source: string;
  status: InquiryStatus;
  name: string;
  email: string;
  origin: string | null;
  subject: string | null;
  message: string;
  details: Record<string, unknown> | null;
  assignee: PersonRef | null;
  firstRepliedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  notes: Note[];
  history: Array<{ id: string; reference: string; subject: string | null; status: InquiryStatus; office: Office; createdAt: string }>;
  activity: Activity[];
}

export interface InquiryCounts {
  status: Partial<Record<InquiryStatus, number>>;
  activeByOffice: Partial<Record<Office, number>>;
}

// ─── Applications ───────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CONDITIONAL_OFFER'
  | 'OFFER'
  | 'WAITLISTED'
  | 'DECLINED'
  | 'WITHDRAWN';
export type Pathway = 'UNDERGRADUATE' | 'POSTGRADUATE' | 'DOCTORAL';

export interface ApplicationSummary {
  id: string;
  reference: string;
  status: ApplicationStatus;
  pathway: Pathway;
  intake: string;
  name: string | null;
  email: string | null;
  residence: string | null;
  firstChoice: string | null;
  completedSteps: number;
  assignee: PersonRef | null;
  notes: number;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Qualification {
  institution?: string;
  qualification?: string;
  country?: string;
  startYear?: number;
  endYear?: number;
  result?: string;
}

export interface Referee {
  name?: string;
  email?: string;
  relationship?: string;
  institution?: string;
}

export interface ApplicationAnswers {
  pathway?: { pathway?: Pathway; intake?: string; studyMode?: string };
  personal?: {
    givenName?: string;
    familyName?: string;
    dateOfBirth?: string;
    gender?: string;
    genderSelfDescribed?: string;
    citizenship?: string;
    residence?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  academic?: { firstChoice?: string; secondChoice?: string; qualifications?: Qualification[] };
  statement?: { statement?: string; referees?: Referee[] };
  funding?: { source?: string; scholarshipInterest?: boolean; notes?: string };
  declaration?: { accurate?: boolean; signature?: string };
}

export interface ApplicationDetail {
  id: string;
  reference: string;
  pathway: Pathway;
  intake: string;
  status: ApplicationStatus;
  email: string | null;
  givenName: string | null;
  familyName: string | null;
  residence: string | null;
  firstChoice: string | null;
  answers: ApplicationAnswers;
  completedSteps: string[];
  version: number;
  assignee: PersonRef | null;
  submittedAt: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
  notes: Note[];
  activity: Activity[];
}

export interface ApplicationStats {
  status: Partial<Record<ApplicationStatus, number>>;
  pathway: Partial<Record<Pathway, number>>;
  intakes: Array<{ intake: string; count: number }>;
}

// ─── Events ─────────────────────────────────────────────────────────────

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
export type RegistrationStatus = 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED';

export interface EventOptions {
  attendeeCategories: string[];
  attendanceModes: string[];
  days: string[];
  interests: string[];
}

export type RegistrationState =
  | { open: true; waitlist: boolean }
  | { open: false; reason: 'not_published' | 'cancelled' | 'closed' | 'ended' };

export interface EventRecord {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  venue: string | null;
  timezone: string;
  startsAt: string;
  endsAt: string | null;
  registrationClosesAt: string | null;
  capacity: number | null;
  status: EventStatus;
  options: EventOptions;
  registration: RegistrationState;
  createdAt: string;
  updatedAt: string;
}

export interface EventSummary extends EventRecord {
  counts: { confirmed: number; waitlisted: number; cancelled: number; checkedIn: number };
}

export interface Tally {
  value: string;
  count: number;
}

export interface EventDetail extends EventRecord {
  breakdown: {
    status: Partial<Record<RegistrationStatus, number>>;
    checkedIn: number;
    attendanceMode: Tally[];
    attendeeCategory: Tally[];
    days: Tally[];
    interests: Tally[];
  };
}

export interface Registration {
  id: string;
  eventId: string;
  code: string;
  status: RegistrationStatus;
  name: string;
  email: string;
  phone: string | null;
  place: string | null;
  organisation: string | null;
  role: string | null;
  attendeeCategory: string | null;
  attendanceMode: string | null;
  days: string | null;
  interests: string[];
  question: string | null;
  accessNeeds: string | null;
  wantsUpdates: boolean;
  checkedInAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Store ──────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'AWAITING_PAYMENT'
  | 'PAID'
  | 'FULFILLING'
  | 'DISPATCHED'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';
export type PaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type ProductStatus = 'AVAILABLE' | 'PREORDER' | 'SOLD_OUT' | 'ARCHIVED';
export type ProductKind = 'APPAREL' | 'ARTIFACT' | 'BOOK' | 'DIGITAL' | 'MEDIA' | 'MERCHANDISE';

export interface OrderSummary {
  id: string;
  number: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentRail: 'MOBILE_MONEY' | 'CARD';
  fulfilment: 'DIGITAL' | 'PICKUP' | 'COURIER' | 'EXPRESS';
  customerName: string;
  customerEmail: string;
  totalCents: number;
  currency: string;
  lines: number;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  sku: string;
  name: string;
  size: string | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface OrderDetail {
  id: string;
  number: string;
  status: OrderStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  deliveryAddress: string | null;
  fulfilment: OrderSummary['fulfilment'];
  fulfilmentLabel: string;
  paymentRail: OrderSummary['paymentRail'];
  railLabel: string;
  paymentStatus: PaymentStatus;
  paymentProvider: string | null;
  paymentReference: string | null;
  currency: string;
  subtotalCents: number;
  deliveryCents: number;
  totalCents: number;
  staffNote: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  paymentEvents: Array<{ id: string; provider: string; kind: string; outcome: string; receivedAt: string }>;
  nextStatuses: OrderStatus[];
  activity: Activity[];
}

export interface StoreStats {
  status: Partial<Record<OrderStatus, number>>;
  revenueCents: number;
  revenue30dCents: number;
  topProducts: Array<{ sku: string; name: string; quantity: number; revenueCents: number }>;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  kind: ProductKind;
  status: ProductStatus;
  priceCents: number;
  currency: string;
  hasSizes: boolean;
  isDigital: boolean;
  stockRemaining: number | null;
  position: number;
  sold: number;
  updatedAt: string;
}

// ─── Journal ────────────────────────────────────────────────────────────

export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  status: ArticleStatus;
  scheduled: boolean;
  publishedAt: string | null;
  readingMinutes: number;
  updatedBy: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  coverImageUrl: string | null;
  authorName: string;
  categories: string[];
  tags: string[];
  status: ArticleStatus;
  publishedAt: string | null;
  readingMinutes: number;
  createdBy: { name: string } | null;
  updatedBy: { name: string } | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Audience ───────────────────────────────────────────────────────────

export interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  source: 'NEWSLETTER' | 'EVENT_REGISTRATION' | 'STORE_ORDER' | 'ADMISSIONS' | 'ADMIN';
  consentText: string;
  consentedAt: string;
  unsubscribedAt: string | null;
  createdAt: string;
}

// ─── Staff, audit, settings ─────────────────────────────────────────────

export interface StaffMember {
  id: string;
  email: string;
  name: string;
  title: string | null;
  roles: StaffRole[];
  roleLabels: string[];
  offices: Office[];
  status: StaffStatus;
  lastSignInAt: string | null;
  lockedUntil: string | null;
  createdAt: string;
}

export interface DirectoryEntry {
  id: string;
  name: string;
  offices: Office[];
}

export interface IssuedLink {
  url: string;
  expiresAt: string;
}

export interface StaffSessionRecord {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  current: boolean;
}

export interface AuditEntry {
  id: string;
  actorId: string | null;
  actorLabel: string;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  ipAddress: string | null;
  createdAt: string;
}

export interface OfficeRoute {
  office: Office;
  label: string;
  responseTarget: string;
  notifyEmails: string[];
}

export interface SystemStatus {
  siteUrl: string;
  email: {
    configured: boolean;
    from: string | null;
    replyTo: string;
    pending: number;
    failed: number;
    sentLast24h: number;
  };
  payments: { flutterwave: boolean };
  maintenance: { scheduled: boolean };
}
