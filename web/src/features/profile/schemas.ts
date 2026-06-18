import { z } from "zod";

// PUT /api/profile/paypal-handle response — the persisted handle + whether one
// is now set (drives gating of the PayPal buttons across the app).
export const PayPalHandleResponseSchema = z.object({
  payPalHandle: z.string().nullable(),
  payPalHandleSet: z.boolean(),
});

// --- Form schema ---

// Mirrors the backend validator: PayPal.Me handle charset is `[A-Za-z0-9]`
// (no spaces/slashes so the paypal.me/{handle}/{amount}EUR URL stays valid),
// max 40 chars. Empty input is rejected here — clearing is a separate action.
export const PayPalHandleFormSchema = z.object({
  handle: z
    .string()
    .trim()
    .min(1, "Pflichtfeld")
    .max(40, "Höchstens 40 Zeichen.")
    .regex(/^[A-Za-z0-9]+$/, "Nur Buchstaben und Zahlen erlaubt (kein /, keine Leerzeichen)."),
});
