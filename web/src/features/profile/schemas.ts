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

// Mirrors the backend ChangePasswordRequestValidator: the new password must be at
// least 10 chars, contain a letter AND a digit, and differ from the current one.
// confirmNewPassword must match newPassword. The current password only has to be
// non-empty here (the server verifies it against the stored hash).
export const ChangePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Pflichtfeld"),
    newPassword: z.string(),
    confirmNewPassword: z.string().min(1, "Pflichtfeld"),
  })
  .superRefine((values, ctx) => {
    if (values.newPassword.length < 10) {
      ctx.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Mindestens 10 Zeichen, Chef.",
      });
    }
    if (!(/[A-Za-z]/.test(values.newPassword) && /\d/.test(values.newPassword))) {
      ctx.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Mindestens ein Buchstabe und eine Ziffer, Chef.",
      });
    }
    if (values.newPassword.length > 0 && values.newPassword === values.currentPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Das neue Passwort muss sich vom aktuellen unterscheiden.",
      });
    }
    if (values.newPassword !== values.confirmNewPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmNewPassword"],
        message: "Die Passwörter stimmen nicht überein, Chef.",
      });
    }
  });
