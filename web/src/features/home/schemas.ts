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
// otherwise; `isMe` highlights the caller's row. `tierEmoji` is the person's
// Döner-Tier glyph (🐺/🐎/…), null when they have no tier yet.
const LeaderboardRowSchema = z.object({
  rank: z.number().int(),
  userId: z.string(),
  displayName: z.string(),
  avatarColorHex: z.string(),
  count: z.number().int(),
  isMe: z.boolean(),
  medal: z.string().nullable(),
  tierEmoji: z.string().nullable(),
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

// One numbered package line on the Abholer's print sheet — article-type ordered, tagged with who it
// belongs to so the number can be written on the bag. `lineTotalCents` is this line's own total.
const PrintLineSchema = z.object({
  number: z.number().int(),
  // Article-type section header (product name: "Döner", "Dürüm", "Pizza" …).
  section: z.string(),
  personName: z.string(),
  productLabel: z.string(),
  description: z.string(),
  quantity: z.number().int(),
  lineTotalCents: z.number().int(),
  isPickup: z.boolean(),
});

// One grouped "n× …" line of the shop summary (identical items folded together).
const PrintSummarySchema = z.object({
  label: z.string(),
  quantity: z.number().int(),
});

// The designated Abholer (pickup person) for the day. `payPalUrl` is the
// prefilled paypal.me link the caller can pay their share through; it is null
// when the caller IS the collector, hasn't ordered, or the collector has no
// handle → the pay button renders disabled.
const DayAbholerSchema = z.object({
  name: z.string(),
  initials: z.string(),
  colorHex: z.string(),
  payPalUrl: z.string().nullable(),
});

// Today's Döner-Tag. `isOpen` is the discriminant the section switches on;
// the rich fields are present (synonym/pushText/orders…) only when open.
// `abholer` is null until a collector is designated; `amICollector` flags
// whether the caller is that pickup person (they pay no one).
const DashboardDaySchema = z.object({
  isOpen: z.boolean(),
  id: z.string().nullable(),
  synonym: z.string().nullable(),
  pushText: z.string().nullable(),
  cutoffLabel: z.string().nullable(),
  participantCount: z.number().int(),
  pickupNames: z.array(z.string()),
  iCanStillOrder: z.boolean(),
  // Manual lock set by the collector's "Bestellung schließen". Flips which
  // collector button shows on the open-day card; also drives iCanStillOrder.
  isOrderingClosed: z.boolean(),
  amICollector: z.boolean(),
  abholer: DayAbholerSchema.nullable(),
  orders: z.array(OrderRowSchema),
  // The Abholer's printable order sheet, built server-side (also drives the e-mailed PDF): numbered
  // per-package lines in article-type order + the grouped "für die Theke" shop summary.
  printLines: z.array(PrintLineSchema),
  printSummary: z.array(PrintSummarySchema),
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

// GET /api/debts/history (FEATURE 4 / B12) — the caller's own settled payments,
// newest-settled first, capped at 10. A standalone read-only payload (NOT part
// of the dashboard aggregate). `amountLabel` already includes the trailing
// " €" — unlike the older dashboard debt rows — so it is rendered as-is.
// `settledAt` is an ISO-8601 timestamp the card formats into a short German date.
const PaymentHistoryRowSchema = z.object({
  personName: z.string(),
  initials: z.string(),
  avatarColorHex: z.string(),
  amountCents: z.number().int(),
  amountLabel: z.string(),
  settledAt: z.string(),
  reason: z.string(),
});

export const PaymentHistorySchema = z.object({
  payments: z.array(PaymentHistoryRowSchema),
});

// GET /api/debts/receivables (FEATURE C-2) — what the collector is still owed:
// open debts others have toward them, plus the already-settled ones. A
// standalone read-only payload (NOT part of the dashboard aggregate). Open rows
// come first, then settled. `amountLabel`/`*TotalLabel` already carry the
// trailing " €" → rendered as-is. `settledAt`/`dayLabel` are null on open rows.
const ReceivableRowSchema = z.object({
  id: z.string(),
  debtorName: z.string(),
  initials: z.string(),
  avatarColorHex: z.string(),
  reason: z.string(),
  dayLabel: z.string().nullable(),
  amountCents: z.number().int(),
  amountLabel: z.string(),
  isSettled: z.boolean(),
  settledAt: z.string().nullable(),
});

export const ReceivablesSchema = z.object({
  openCount: z.number().int(),
  openTotalCents: z.number().int(),
  openTotalLabel: z.string(),
  settledCount: z.number().int(),
  settledTotalCents: z.number().int(),
  settledTotalLabel: z.string(),
  rows: z.array(ReceivableRowSchema),
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
