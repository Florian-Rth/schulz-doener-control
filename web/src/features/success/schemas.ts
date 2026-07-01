import { z } from "zod";

// The abholer (pickup person) the caller owes, when not pickup themselves.
const AbholerSchema = z.object({
  name: z.string(),
  initials: z.string(),
  colorHex: z.string(),
  payPalHandle: z.string().nullable(),
});

// One line of the ordered result. priceCents is per unit; lineTotalCents is the
// per-line total. The labels already include the euro sign — render as-is.
const OrderResultLineSchema = z.object({
  productLabel: z.string(),
  detail: z.string(),
  quantity: z.number().int(),
  priceCents: z.number().int(),
  lineTotalCents: z.number().int(),
});

// GET /api/orders/{id}/result — the server-driven success view. Money is in
// integer cents; `priceCents` is the ORDER TOTAL across all lines. No pay link
// here: a non-pickup payer reimburses the Abholer on the home screen once
// ordering is closed (orders frozen), so the owes-abholer card only informs.
export const OrderResultSchema = z.object({
  lines: z.array(OrderResultLineSchema),
  priceCents: z.number().int(),
  isPickup: z.boolean(),
  abholer: AbholerSchema.nullable(),
  collectCents: z.number().int(),
  collectCount: z.number().int(),
});
