import { z } from "zod";

// The abholer (pickup person) the caller owes, when not pickup themselves.
const AbholerSchema = z.object({
  name: z.string(),
  initials: z.string(),
  colorHex: z.string(),
  payPalHandle: z.string().nullable(),
});

// GET /api/orders/{id}/result — the server-driven success view. Money is in
// integer cents; `myPayPalUrl` is the prefilled paypal.me link (null when the
// abholer has no handle → the button renders disabled).
export const OrderResultSchema = z.object({
  productLabel: z.string(),
  priceCents: z.number().int(),
  detail: z.string(),
  isPickup: z.boolean(),
  abholer: AbholerSchema.nullable(),
  collectCents: z.number().int(),
  collectCount: z.number().int(),
  myPayPalUrl: z.string().nullable(),
});
