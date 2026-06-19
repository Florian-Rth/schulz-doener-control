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
// integer cents; `priceCents` is the ORDER TOTAL across all lines. `myPayPalUrl`
// is the prefilled paypal.me link (null when the abholer has no handle → the
// button renders disabled).
export const OrderResultSchema = z.object({
  lines: z.array(OrderResultLineSchema),
  priceCents: z.number().int(),
  isPickup: z.boolean(),
  abholer: AbholerSchema.nullable(),
  collectCents: z.number().int(),
  collectCount: z.number().int(),
  myPayPalUrl: z.string().nullable(),
});
