import { EmailParts, esc, factTable, layout, paragraph, quote } from './email-layout';

/**
 * Every message the university sends, in one place, so tone and facts stay
 * consistent. Each template returns subject, HTML and a plain-text version.
 */

const formatDate = (date: Date, timeZone = 'Africa/Kampala') =>
  new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeStyle: 'short', timeZone }).format(date);

const formatMoney = (cents: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);

const textFacts = (rows: ReadonlyArray<readonly [string, string]>) =>
  rows.map(([label, value]) => `${label}: ${value}`).join('\n');

// ─── Inquiries ────────────────────────────────────────────────────────────

export function inquiryReceived(input: {
  name: string;
  reference: string;
  officeLabel: string;
  responseTarget: string;
  message: string;
}): EmailParts {
  const first = input.name.split(' ')[0];
  const facts: Array<[string, string]> = [
    ['Reference', input.reference],
    ['Routed to', input.officeLabel],
    ['Expected reply', `within ${input.responseTarget}`],
  ];
  return {
    subject: `We have your message — ${input.reference}`,
    html: layout({
      preheader: `Your message is with ${input.officeLabel}. Reference ${input.reference}.`,
      eyebrow: 'Message received',
      heading: `Thank you, ${first}.`,
      bodyHtml:
        paragraph(`Your message has reached <strong>${esc(input.officeLabel)}</strong>. A member of the team will reply to this address.`) +
        factTable(facts) +
        paragraph('For your records, this is what you sent:') +
        quote(input.message),
      footnote: `Quote <strong>${esc(input.reference)}</strong> if you write again about this, and simply reply to this email to add anything.`,
    }),
    text: `Thank you, ${first}.\n\nYour message has reached ${input.officeLabel}.\n\n${textFacts(facts)}\n\nWhat you sent:\n${input.message}\n\nQuote ${input.reference} if you write again about this.`,
  };
}

export function inquiryStaffAlert(input: {
  reference: string;
  officeLabel: string;
  name: string;
  email: string;
  origin?: string | null;
  subject?: string | null;
  message: string;
  adminUrl: string;
}): EmailParts {
  const facts: Array<[string, string]> = [
    ['From', `${input.name} <${input.email}>`],
    ['Office', input.officeLabel],
    ['Reference', input.reference],
  ];
  if (input.origin) facts.push(['Writing from', input.origin]);
  if (input.subject) facts.push(['Subject', input.subject]);
  return {
    subject: `[${input.officeLabel}] ${input.subject || 'New message'} — ${input.name}`,
    html: layout({
      preheader: input.message.slice(0, 140),
      eyebrow: 'New message',
      heading: `${input.officeLabel} has a new message`,
      bodyHtml: factTable(facts) + quote(input.message),
      action: { label: 'Open in the admin console', url: input.adminUrl },
    }),
    text: `${textFacts(facts)}\n\n${input.message}\n\nOpen: ${input.adminUrl}`,
  };
}

export function inquiryReply(input: {
  name: string;
  reference: string;
  staffName: string;
  officeLabel: string;
  originalSubject?: string | null;
  body: string;
}): EmailParts {
  const subjectLine = input.originalSubject ? `Re: ${input.originalSubject}` : `Your message to ${input.officeLabel}`;
  return {
    subject: `${subjectLine} [${input.reference}]`,
    html: layout({
      preheader: input.body.slice(0, 140),
      eyebrow: input.officeLabel,
      heading: `Dear ${input.name.split(' ')[0]},`,
      bodyHtml:
        `<div style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#102a43;">${esc(input.body).replace(/\n/g, '<br />')}</div>` +
        paragraph(`${esc(input.staffName)}<br /><span style="color:#4a647d;">${esc(input.officeLabel)}</span>`),
      footnote: `Reply to this email to continue the conversation. Reference ${esc(input.reference)}.`,
    }),
    text: `Dear ${input.name.split(' ')[0]},\n\n${input.body}\n\n${input.staffName}\n${input.officeLabel}\n\nReference ${input.reference}`,
  };
}

// ─── Admissions ───────────────────────────────────────────────────────────

export function applicationResumeLink(input: {
  givenName?: string | null;
  reference: string;
  pathwayLabel: string;
  resumeUrl: string;
}): EmailParts {
  const greeting = input.givenName ? `Hello ${input.givenName},` : 'Hello,';
  return {
    subject: `Continue your application — ${input.reference}`,
    html: layout({
      preheader: 'Your private link to pick up your application where you left off.',
      eyebrow: `${input.pathwayLabel} application`,
      heading: 'Your application is saved',
      bodyHtml:
        paragraph(esc(greeting)) +
        paragraph('Every answer you give is saved as you type. Use the button below on any device to continue exactly where you left off.') +
        factTable([['Application', input.reference]]),
      action: { label: 'Continue my application', url: input.resumeUrl },
      footnote:
        'This link is personal: anyone who has it can open your application, so please do not forward it. Requesting a new link switches this one off.',
    }),
    text: `${greeting}\n\nYour application ${input.reference} is saved. Continue here:\n${input.resumeUrl}\n\nThis link is personal; please do not forward it.`,
  };
}

export function applicationSubmitted(input: {
  givenName: string;
  reference: string;
  pathwayLabel: string;
  intake: string;
  firstChoice?: string | null;
}): EmailParts {
  const facts: Array<[string, string]> = [
    ['Application', input.reference],
    ['Pathway', input.pathwayLabel],
    ['Intake', input.intake],
  ];
  if (input.firstChoice) facts.push(['First choice', input.firstChoice]);
  return {
    subject: `Application received — ${input.reference}`,
    html: layout({
      preheader: 'Your application has been submitted to the Admissions Office.',
      eyebrow: 'Application submitted',
      heading: `Well done, ${input.givenName}.`,
      bodyHtml:
        paragraph('Your application is now with the Admissions Office. An admissions officer will review it and write to you at this address, including about any documents they need to see.') +
        factTable(facts),
      footnote: `Quote <strong>${esc(input.reference)}</strong> in any correspondence about your application.`,
    }),
    text: `Well done, ${input.givenName}.\n\nYour application is now with the Admissions Office.\n\n${textFacts(facts)}`,
  };
}

export function applicationStaffAlert(input: {
  reference: string;
  name: string;
  email: string;
  pathwayLabel: string;
  intake: string;
  firstChoice?: string | null;
  residence?: string | null;
  adminUrl: string;
}): EmailParts {
  const facts: Array<[string, string]> = [
    ['Applicant', `${input.name} <${input.email}>`],
    ['Pathway', input.pathwayLabel],
    ['Intake', input.intake],
  ];
  if (input.firstChoice) facts.push(['First choice', input.firstChoice]);
  if (input.residence) facts.push(['Residence', input.residence]);
  return {
    subject: `New application ${input.reference} — ${input.name}`,
    html: layout({
      preheader: `${input.pathwayLabel} · ${input.intake}`,
      eyebrow: 'New application',
      heading: `${input.name} has applied`,
      bodyHtml: factTable(facts),
      action: { label: 'Review the application', url: input.adminUrl },
    }),
    text: `${textFacts(facts)}\n\nReview: ${input.adminUrl}`,
  };
}

// ─── Events ───────────────────────────────────────────────────────────────

export function registrationConfirmed(input: {
  name: string;
  code: string;
  eventTitle: string;
  startsAt: Date;
  timezone: string;
  venue?: string | null;
  attendanceMode?: string | null;
  days?: string | null;
  waitlisted: boolean;
}): EmailParts {
  const facts: Array<[string, string]> = [
    ['Registration code', input.code],
    ['Begins', formatDate(input.startsAt, input.timezone)],
  ];
  if (input.attendanceMode) facts.push(['Joining', input.attendanceMode]);
  if (input.days) facts.push(['Days', input.days]);
  if (input.venue) facts.push(['Venue', input.venue]);
  const first = input.name.split(' ')[0];
  const heading = input.waitlisted ? `You are on the waiting list, ${first}` : `Your seat is confirmed, ${first}`;
  const lead = input.waitlisted
    ? 'The event is full at the moment. You are on the waiting list, and we will write to you the moment a place opens.'
    : 'We look forward to welcoming you. Keep this email: your registration code is how we find you at the door and in the online room.';
  return {
    subject: input.waitlisted ? `Waiting list — ${input.eventTitle}` : `You are registered — ${input.eventTitle}`,
    html: layout({
      preheader: `${input.eventTitle} · ${formatDate(input.startsAt, input.timezone)}`,
      eyebrow: input.eventTitle,
      heading,
      bodyHtml: paragraph(lead) + factTable(facts),
      footnote: 'Need to change something or cannot attend? Reply to this email and we will update your registration.',
    }),
    text: `${heading}.\n\n${lead}\n\n${textFacts(facts)}`,
  };
}

// ─── Store ────────────────────────────────────────────────────────────────

export interface OrderLine {
  readonly name: string;
  readonly size?: string | null;
  readonly quantity: number;
  readonly lineTotalCents: number;
}

function orderLinesHtml(lines: readonly OrderLine[], currency: string, deliveryCents: number, totalCents: number) {
  const rows = lines
    .map(
      (line) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #e0ebf6;font-size:14px;color:#102a43;">${esc(line.name)}${line.size ? ` <span style="color:#4a647d;">· ${esc(line.size)}</span>` : ''} <span style="color:#4a647d;">× ${line.quantity}</span></td>
        <td style="padding:10px 0;border-bottom:1px solid #e0ebf6;font-size:14px;color:#102a43;text-align:right;white-space:nowrap;">${esc(formatMoney(line.lineTotalCents, currency))}</td>
      </tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 24px;">
    ${rows}
    <tr><td style="padding:10px 0;font-size:13px;color:#4a647d;">Delivery</td><td style="padding:10px 0;font-size:13px;color:#4a647d;text-align:right;">${esc(deliveryCents ? formatMoney(deliveryCents, currency) : 'Free')}</td></tr>
    <tr><td style="padding:10px 0;font-size:15px;color:#0a3254;font-weight:700;">Total</td><td style="padding:10px 0;font-size:15px;color:#0a3254;font-weight:700;text-align:right;">${esc(formatMoney(totalCents, currency))}</td></tr>
  </table>`;
}

function orderLinesText(lines: readonly OrderLine[], currency: string, deliveryCents: number, totalCents: number) {
  return [
    ...lines.map((l) => `${l.quantity} × ${l.name}${l.size ? ` (${l.size})` : ''} — ${formatMoney(l.lineTotalCents, currency)}`),
    `Delivery — ${deliveryCents ? formatMoney(deliveryCents, currency) : 'Free'}`,
    `Total — ${formatMoney(totalCents, currency)}`,
  ].join('\n');
}

export function orderPlaced(input: {
  name: string;
  number: string;
  lines: readonly OrderLine[];
  currency: string;
  deliveryCents: number;
  totalCents: number;
  fulfilmentLabel: string;
  paymentNextStep: string;
  statusUrl: string;
}): EmailParts {
  const first = input.name.split(' ')[0];
  return {
    subject: `Order ${input.number} — thank you`,
    html: layout({
      preheader: `Order ${input.number} · ${formatMoney(input.totalCents, input.currency)}`,
      eyebrow: `Order ${input.number}`,
      heading: `Thank you, ${first}.`,
      bodyHtml:
        paragraph(esc(input.paymentNextStep)) +
        orderLinesHtml(input.lines, input.currency, input.deliveryCents, input.totalCents) +
        factTable([['Delivery', input.fulfilmentLabel]]),
      action: { label: 'View your order', url: input.statusUrl },
      footnote: 'Proceeds from the store fund scholarships, repatriation research and the Kahigiriza Memorial.',
    }),
    text: `Thank you, ${first}.\n\n${input.paymentNextStep}\n\n${orderLinesText(input.lines, input.currency, input.deliveryCents, input.totalCents)}\n\nDelivery: ${input.fulfilmentLabel}\nView your order: ${input.statusUrl}`,
  };
}

export function orderPaid(input: { name: string; number: string; totalCents: number; currency: string }): EmailParts {
  const first = input.name.split(' ')[0];
  const amount = formatMoney(input.totalCents, input.currency);
  return {
    subject: `Payment received — order ${input.number}`,
    html: layout({
      preheader: `We have received ${amount} for order ${input.number}.`,
      eyebrow: `Order ${input.number}`,
      heading: `Payment received, ${first}.`,
      bodyHtml:
        paragraph(`We have received your payment of <strong>${esc(amount)}</strong>. We will let you know as soon as your order is on its way.`) +
        paragraph('The link in your order confirmation email shows your order’s progress at any time.'),
    }),
    text: `Payment received, ${first}.\n\nWe have received ${amount} for order ${input.number}. We will let you know as soon as your order is on its way.`,
  };
}

export function orderStaffAlert(input: {
  number: string;
  name: string;
  email: string;
  totalCents: number;
  currency: string;
  lines: readonly OrderLine[];
  deliveryCents: number;
  fulfilmentLabel: string;
  railLabel: string;
  adminUrl: string;
}): EmailParts {
  return {
    subject: `New order ${input.number} — ${formatMoney(input.totalCents, input.currency)}`,
    html: layout({
      preheader: `${input.name} · ${input.fulfilmentLabel} · ${input.railLabel}`,
      eyebrow: 'New order',
      heading: `Order ${input.number}`,
      bodyHtml:
        factTable([
          ['Customer', `${input.name} <${input.email}>`],
          ['Delivery', input.fulfilmentLabel],
          ['Pays by', input.railLabel],
        ]) + orderLinesHtml(input.lines, input.currency, input.deliveryCents, input.totalCents),
      action: { label: 'Open the order', url: input.adminUrl },
    }),
    text: `Order ${input.number}\n${input.name} <${input.email}>\n\n${orderLinesText(input.lines, input.currency, input.deliveryCents, input.totalCents)}\n\nOpen: ${input.adminUrl}`,
  };
}

// ─── Staff ────────────────────────────────────────────────────────────────

export function staffInvitation(input: { name: string; invitedBy: string; roles: string; url: string; expiresAt: Date }): EmailParts {
  return {
    subject: 'Your Sankofa admin console invitation',
    html: layout({
      preheader: `${input.invitedBy} has invited you to the admin console.`,
      eyebrow: 'Admin console',
      heading: `Welcome, ${input.name.split(' ')[0]}.`,
      bodyHtml:
        paragraph(`${esc(input.invitedBy)} has given you access to the Sankofa Alkebulan University admin console.`) +
        factTable([
          ['Access', input.roles],
          ['Invitation expires', formatDate(input.expiresAt)],
        ]),
      action: { label: 'Choose your password', url: input.url },
      footnote: 'If you were not expecting this, you can ignore it — nothing happens until a password is chosen.',
    }),
    text: `Welcome, ${input.name}.\n\n${input.invitedBy} has given you access to the admin console (${input.roles}).\nChoose your password: ${input.url}\nThe invitation expires ${formatDate(input.expiresAt)}.`,
  };
}

export function staffPasswordReset(input: { name: string; url: string; expiresAt: Date }): EmailParts {
  return {
    subject: 'Reset your Sankofa admin console password',
    html: layout({
      preheader: 'A link to choose a new password.',
      eyebrow: 'Admin console',
      heading: 'Choose a new password',
      bodyHtml: paragraph(`Hello ${esc(input.name.split(' ')[0])}, use the button below to choose a new password. The link works once and expires ${esc(formatDate(input.expiresAt))}.`),
      action: { label: 'Choose a new password', url: input.url },
      footnote: 'If you did not ask for this, ignore this email: your current password keeps working.',
    }),
    text: `Hello ${input.name.split(' ')[0]},\n\nChoose a new password: ${input.url}\nThe link works once and expires ${formatDate(input.expiresAt)}.\n\nIf you did not ask for this, ignore this email.`,
  };
}
