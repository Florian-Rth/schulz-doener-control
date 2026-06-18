import { z } from "zod";

// GET /api/dashboard — the one aggregate the home screen consumes (PLAN F11).
// It composes the granular stats / tier / leaderboard / today's day / open-debts
// payloads into a single mobile round-trip. Money is always integer cents; the
// `*Label` strings carry the German-formatted display value the backend renders.

// The 4 stat cards (Döner gesamt · Diesen Monat € · Offen · Streak).
const DashboardStatsSchema = z.object({
  totalDoener: z.number().int(),
  totalDoenerLabel: z.string(),
  monthSpendCents: z.number().int(),
  monthSpendLabel: z.string(),
  openPaymentsCount: z.number().int(),
  streakWeeks: z.number().int(),
});

// The navy Döner-Tier card.
const DashboardTierSchema = z.object({
  emoji: z.string(),
  name: z.string(),
  tagline: z.string(),
  tags: z.array(z.string()),
  orderCount: z.number().int(),
});

// One leaderboard row. `medal` carries the 🥇/🥈/🥉 glyph for the top 3, null
// otherwise; `isMe` highlights the caller's row.
const LeaderboardRowSchema = z.object({
  rank: z.number().int(),
  userId: z.string(),
  displayName: z.string(),
  avatarColorHex: z.string(),
  count: z.number().int(),
  isMe: z.boolean(),
  medal: z.string().nullable(),
});

const DashboardLeaderboardSchema = z.object({
  year: z.number().int(),
  rows: z.array(LeaderboardRowSchema),
  // "Nur noch X Döner bis Platz N" — both null once the caller leads.
  doenerToNextRank: z.number().int().nullable(),
  nextRank: z.number().int().nullable(),
});

// One order row inside the running Döner-Tag (avatar + product + person · desc).
const OrderRowSchema = z.object({
  orderId: z.string(),
  personName: z.string(),
  avatarColorHex: z.string(),
  productLabel: z.string(),
  description: z.string(),
  priceCents: z.number().int(),
  priceLabel: z.string(),
  isMine: z.boolean(),
  isPickup: z.boolean(),
});

// Today's Döner-Tag. `isOpen` is the discriminant the section switches on;
// the rich fields are present (synonym/pushText/orders…) only when open.
const DashboardDaySchema = z.object({
  isOpen: z.boolean(),
  id: z.string().nullable(),
  synonym: z.string().nullable(),
  pushText: z.string().nullable(),
  cutoffLabel: z.string().nullable(),
  participantCount: z.number().int(),
  pickupNames: z.array(z.string()),
  iCanStillOrder: z.boolean(),
  orders: z.array(OrderRowSchema),
});

// One open debt the caller owes ("Offene Zahlungen"). `paypalUrl` is null when
// the creditor has no PayPal handle → the button renders disabled.
const DebtRowSchema = z.object({
  id: z.string(),
  creditorName: z.string(),
  creditorAvatarColorHex: z.string(),
  reason: z.string(),
  dayLabel: z.string().nullable(),
  amountCents: z.number().int(),
  amountLabel: z.string(),
  paypalUrl: z.string().nullable(),
});

const DashboardDebtsSchema = z.object({
  openCount: z.number().int(),
  totalCents: z.number().int(),
  totalLabel: z.string(),
  rows: z.array(DebtRowSchema),
});

export const DashboardSchema = z.object({
  firstName: z.string(),
  displayName: z.string(),
  avatarColorHex: z.string(),
  stats: DashboardStatsSchema,
  tier: DashboardTierSchema,
  leaderboard: DashboardLeaderboardSchema,
  day: DashboardDaySchema,
  debts: DashboardDebtsSchema,
  // Optional in-foreground open-day toast text (mock parity); null = no toast.
  toast: z.string().nullable(),
});
