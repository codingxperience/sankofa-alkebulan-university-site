import type {
  ApplicationStatus,
  ArticleStatus,
  DaybookKind,
  EventStatus,
  InquiryStatus,
  Office,
  OrderStatus,
  Pathway,
  PaymentStatus,
  ProductKind,
  ProductStatus,
  RegistrationStatus,
  StaffRole,
  StaffStatus,
  Subscriber,
} from './types';

/**
 * The words the console uses for every state a record can be in, and the
 * colour each state wears. Tones carry meaning, not decoration:
 *   attention — waiting for someone here to act
 *   progress  — being worked on
 *   waiting   — waiting on someone outside
 *   done      — finished well
 *   muted     — closed, nothing more to do
 *   danger    — stopped or reversed
 */
export type Tone = 'attention' | 'progress' | 'waiting' | 'done' | 'muted' | 'danger';

interface Term {
  readonly label: string;
  readonly tone: Tone;
}

export const OFFICE_ORDER: readonly Office[] = ['ADMISSIONS', 'PROGRAMMES', 'RESEARCH', 'STUDENT_LIFE', 'GOVERNANCE', 'MEDIA', 'CENTRAL'];

/** Fallback names; the live names come from Settings → Offices. */
export const OFFICE_NAMES: Record<Office, string> = {
  ADMISSIONS: 'Admissions Office',
  PROGRAMMES: 'Academic Pathways',
  RESEARCH: 'Research & Partnerships',
  STUDENT_LIFE: 'Student Systems',
  GOVERNANCE: 'Governance & Administration',
  MEDIA: 'Media & Public Scholarship',
  CENTRAL: 'Central Desk',
};

export const INQUIRY_STATUS: Record<InquiryStatus, Term> = {
  NEW: { label: 'New', tone: 'attention' },
  OPEN: { label: 'Open', tone: 'progress' },
  AWAITING_REPLY: { label: 'Replied', tone: 'waiting' },
  RESOLVED: { label: 'Resolved', tone: 'done' },
  SPAM: { label: 'Spam', tone: 'muted' },
};

export const INQUIRY_SOURCE: Readonly<Record<string, string | undefined>> = {
  CONTACT_PAGE: 'Contact page',
  ADMISSIONS_DESK: 'Admissions desk',
  PORTAL_FORM: 'Portal form',
};

export const APPLICATION_STATUS: Record<ApplicationStatus, Term> = {
  DRAFT: { label: 'In progress', tone: 'muted' },
  SUBMITTED: { label: 'Submitted', tone: 'attention' },
  UNDER_REVIEW: { label: 'Under review', tone: 'progress' },
  CONDITIONAL_OFFER: { label: 'Conditional offer', tone: 'done' },
  OFFER: { label: 'Offer', tone: 'done' },
  WAITLISTED: { label: 'Waitlisted', tone: 'waiting' },
  DECLINED: { label: 'Declined', tone: 'danger' },
  WITHDRAWN: { label: 'Withdrawn', tone: 'muted' },
};

export const REVIEW_STATUSES: readonly ApplicationStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'CONDITIONAL_OFFER',
  'OFFER',
  'WAITLISTED',
  'DECLINED',
  'WITHDRAWN',
];

export const PATHWAY_LABEL: Record<Pathway, string> = {
  UNDERGRADUATE: 'Undergraduate',
  POSTGRADUATE: 'Postgraduate',
  DOCTORAL: 'Doctoral',
};

export const EVENT_STATUS: Record<EventStatus, Term> = {
  DRAFT: { label: 'Draft', tone: 'muted' },
  PUBLISHED: { label: 'Published', tone: 'done' },
  CANCELLED: { label: 'Cancelled', tone: 'danger' },
};

export const REGISTRATION_STATUS: Record<RegistrationStatus, Term> = {
  CONFIRMED: { label: 'Confirmed', tone: 'done' },
  WAITLISTED: { label: 'Waiting list', tone: 'waiting' },
  CANCELLED: { label: 'Cancelled', tone: 'muted' },
};

export const REGISTRATION_CLOSED_REASON: Record<string, string> = {
  not_published: 'Not published',
  cancelled: 'Cancelled',
  closed: 'Registration closed',
  ended: 'Event has ended',
};

export const ORDER_STATUS: Record<OrderStatus, Term> = {
  AWAITING_PAYMENT: { label: 'Awaiting payment', tone: 'attention' },
  PAID: { label: 'Paid', tone: 'progress' },
  FULFILLING: { label: 'Being prepared', tone: 'progress' },
  DISPATCHED: { label: 'Dispatched', tone: 'waiting' },
  READY_FOR_PICKUP: { label: 'Ready for pickup', tone: 'waiting' },
  COMPLETED: { label: 'Completed', tone: 'done' },
  CANCELLED: { label: 'Cancelled', tone: 'muted' },
  REFUNDED: { label: 'Refunded', tone: 'danger' },
};

/** The verb on the button that moves an order into each status. */
export const ORDER_ACTION: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: 'Mark awaiting payment',
  PAID: 'Mark paid',
  FULFILLING: 'Start preparing',
  DISPATCHED: 'Mark dispatched',
  READY_FOR_PICKUP: 'Ready for pickup',
  COMPLETED: 'Mark completed',
  CANCELLED: 'Cancel order',
  REFUNDED: 'Mark refunded',
};

export const PAYMENT_STATUS: Record<PaymentStatus, Term> = {
  UNPAID: { label: 'Unpaid', tone: 'attention' },
  PENDING: { label: 'Pending', tone: 'waiting' },
  PAID: { label: 'Paid', tone: 'done' },
  FAILED: { label: 'Failed', tone: 'danger' },
  REFUNDED: { label: 'Refunded', tone: 'muted' },
};

export const PAYMENT_METHODS = [
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'card_terminal', label: 'Card terminal' },
] as const;

/** How a recorded payment arrived, in words. */
export function paymentProviderLabel(provider: string): string {
  if (provider === 'flutterwave') {
    return 'Flutterwave card checkout';
  }
  return PAYMENT_METHODS.find((method) => method.value === provider)?.label ?? provider;
}

export const PRODUCT_STATUS: Record<ProductStatus, Term> = {
  AVAILABLE: { label: 'Available', tone: 'done' },
  PREORDER: { label: 'Pre-order', tone: 'progress' },
  SOLD_OUT: { label: 'Sold out', tone: 'attention' },
  ARCHIVED: { label: 'Archived', tone: 'muted' },
};

export const PRODUCT_KIND: Record<ProductKind, string> = {
  APPAREL: 'Apparel',
  ARTIFACT: 'Artifact',
  BOOK: 'Book',
  DIGITAL: 'Digital',
  MEDIA: 'Media',
};

export const ARTICLE_STATUS: Record<ArticleStatus | 'SCHEDULED', Term> = {
  DRAFT: { label: 'Draft', tone: 'muted' },
  SCHEDULED: { label: 'Scheduled', tone: 'waiting' },
  PUBLISHED: { label: 'Published', tone: 'done' },
  ARCHIVED: { label: 'Archived', tone: 'muted' },
};

export const SUBSCRIBER_SOURCE: Record<Subscriber['source'], string> = {
  NEWSLETTER: 'Newsletter form',
  EVENT_REGISTRATION: 'Event registration',
  STORE_ORDER: 'Store order',
  ADMISSIONS: 'Admissions',
  ADMIN: 'Added by staff',
};

export const STAFF_STATUS: Record<StaffStatus, Term> = {
  INVITED: { label: 'Invited', tone: 'waiting' },
  ACTIVE: { label: 'Active', tone: 'done' },
  SUSPENDED: { label: 'Suspended', tone: 'danger' },
};

export const ROLES: ReadonlyArray<{ role: StaffRole; label: string; description: string }> = [
  { role: 'OWNER', label: 'Owner', description: 'Everything, including granting and removing administrators.' },
  { role: 'ADMIN', label: 'Administrator', description: 'Everything in the console except managing owners.' },
  { role: 'ADMISSIONS', label: 'Admissions', description: 'Messages and applications: review, assign, decide.' },
  { role: 'COMMUNICATIONS', label: 'Communications', description: 'Messages, the journal and the mailing list.' },
  { role: 'EVENTS', label: 'Events', description: 'Events, registrations and check-in.' },
  { role: 'COMMERCE', label: 'Store', description: 'Orders, payments and the product catalogue.' },
  { role: 'VIEWER', label: 'Viewer', description: 'Can read every part of the console, change nothing.' },
];

export const DAYBOOK_KIND: Record<DaybookKind, { label: string; plural: string; route: string }> = {
  inquiry: { label: 'Message', plural: 'Messages', route: '/admin/inbox' },
  application: { label: 'Application', plural: 'Applications', route: '/admin/admissions' },
  registration: { label: 'Registration', plural: 'Registrations', route: '/admin/events' },
  order: { label: 'Order', plural: 'Orders', route: '/admin/store/orders' },
};

/** Status words for daybook rows, which mix every kind of record. */
export function daybookStatus(kind: DaybookKind, status: string): Term {
  switch (kind) {
    case 'inquiry':
      return INQUIRY_STATUS[status as InquiryStatus] ?? { label: status, tone: 'muted' };
    case 'application':
      return APPLICATION_STATUS[status as ApplicationStatus] ?? { label: status, tone: 'muted' };
    case 'registration':
      return REGISTRATION_STATUS[status as RegistrationStatus] ?? { label: status, tone: 'muted' };
    case 'order':
      return ORDER_STATUS[status as OrderStatus] ?? { label: status, tone: 'muted' };
  }
}
