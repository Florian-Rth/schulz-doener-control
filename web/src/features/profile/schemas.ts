import { z } from "zod";

// PUT /api/profile/paypal-handle response — the persisted handle + whether one
// is now set (drives gating of the PayPal buttons across the app).
export const PayPalHandleResponseSchema = z.object({
  payPalHandle: z.string().nullable(),
  payPalHandleSet: z.boolean(),
});

// PUT /api/profile/display-name response — the persisted name plus the derived
// initials/avatar color (the avatar re-reads these via the session refresh).
export const DisplayNameResponseSchema = z.object({
  displayName: z.string(),
  initials: z.string(),
  avatarColorHex: z.string(),
});

// Mirrors the backend PutDisplayNameRequestValidator: non-empty, max 128 chars.
export const DisplayNameFormSchema = z.object({
  displayName: z.string().trim().min(1, "Pflichtfeld").max(128, "Höchstens 128 Zeichen."),
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

// The newPassword rules shared by both change-password variants, mirroring the
// backend validator: at least 10 chars and at least one letter AND one digit.
const refineNewPassword = (newPassword: string, ctx: z.RefinementCtx): void => {
  if (newPassword.length < 10) {
    ctx.addIssue({
      code: "custom",
      path: ["newPassword"],
      message: "Mindestens 10 Zeichen, Chef.",
    });
  }
  if (!(/[A-Za-z]/.test(newPassword) && /\d/.test(newPassword))) {
    ctx.addIssue({
      code: "custom",
      path: ["newPassword"],
      message: "Mindestens ein Buchstabe und eine Ziffer, Chef.",
    });
  }
};

// The confirm-match rule shared by both variants.
const refineConfirm = (newPassword: string, confirm: string, ctx: z.RefinementCtx): void => {
  if (newPassword !== confirm) {
    ctx.addIssue({
      code: "custom",
      path: ["confirmNewPassword"],
      message: "Die Passwörter stimmen nicht überein, Chef.",
    });
  }
};

// Self-service variant (reached from the profile menu, `mustChangePassword=false`).
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
    refineNewPassword(values.newPassword, ctx);
    if (values.newPassword.length > 0 && values.newPassword === values.currentPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Das neue Passwort muss sich vom aktuellen unterscheiden.",
      });
    }
    refineConfirm(values.newPassword, values.confirmNewPassword, ctx);
  });

// Forced variant (forced first-login change, `mustChangePassword=true`). The
// backend detects "forced" server-side from the signed must_change claim and does
// NOT need the current password — so this schema validates neither it nor the
// new!=current rule (which does not apply when forced). It keeps `currentPassword`
// in the object shape (unconstrained) so both variants infer the same
// `ChangePasswordForm` type and their resolvers unify cleanly; the forced flow
// still hides the field and omits it from the payload (driven by the hook, not
// the schema), so its value is never read here.
export const ChangePasswordForcedFormSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmNewPassword: z.string().min(1, "Pflichtfeld"),
  })
  .superRefine((values, ctx) => {
    refineNewPassword(values.newPassword, ctx);
    refineConfirm(values.newPassword, values.confirmNewPassword, ctx);
  });
