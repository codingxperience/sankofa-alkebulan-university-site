import type { DaybookEntry } from '../../core/types';

/** Where a daybook entry opens in the console. */
export function daybookLink(entry: DaybookEntry): string {
  switch (entry.kind) {
    case 'inquiry':
      return `/admin/inbox/${entry.id}`;
    case 'application':
      return `/admin/admissions/${entry.id}`;
    case 'registration':
      return entry.parent ? `/admin/events/${entry.parent}` : '/admin/events';
    case 'order':
      return `/admin/store/orders/${entry.id}`;
  }
}

/** What happened, in a few words: "Amara Nwosu applied". */
export function daybookAction(entry: DaybookEntry): string {
  const who = entry.who || 'Someone';
  switch (entry.kind) {
    case 'inquiry':
      return `${who} wrote in`;
    case 'application':
      return `${who} applied`;
    case 'registration':
      return `${who} registered${entry.title ? ` for ${entry.title}` : ''}`;
    case 'order':
      return `${who} placed an order`;
  }
}
