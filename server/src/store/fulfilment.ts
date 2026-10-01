import type { FulfilmentMethod, PaymentRail } from '../generated/prisma/client';

/**
 * Delivery options exactly as the storefront presents them. The server is the
 * authority on what each costs; the browser only says which one was chosen.
 */
export const DELIVERY: Record<Exclude<FulfilmentMethod, 'DIGITAL'>, { label: string; detail: string; cents: number }> = {
  PICKUP: { label: 'Campus pickup — Mbarara', detail: 'Ready in 2 days · bring student ID', cents: 0 },
  COURIER: { label: 'Continental courier', detail: '3–7 days · 54 states', cents: 600 },
  EXPRESS: { label: 'Diaspora express', detail: '5–10 days · worldwide', cents: 1800 },
};

export const FULFILMENT_LABELS: Record<FulfilmentMethod, string> = {
  DIGITAL: 'Instant delivery',
  PICKUP: DELIVERY.PICKUP.label,
  COURIER: DELIVERY.COURIER.label,
  EXPRESS: DELIVERY.EXPRESS.label,
};

export const RAIL_LABELS: Record<PaymentRail, string> = {
  MOBILE_MONEY: 'Mobile money',
  CARD: 'Card',
};

export const SIZES = ['S', 'M', 'L', 'XL', '2XL'] as const;
