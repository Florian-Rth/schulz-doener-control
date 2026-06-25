import { z } from "zod";
import { authCopy } from "./copy";

// The self-registration policy the login/register screens react to. Mirrors the wire values the
// client config carries (1 Enabled / 2 Disabled / 3 SecretKeyOnly). Kept as a local copy so the
// auth feature stays self-contained and never imports another feature; the route layer (which may
// read pwa-gate) feeds the numeric mode into the pages, which compare against these.
export const AuthRegistrationMode = {
  Enabled: 1,
  Disabled: 2,
  SecretKeyOnly: 3,
} as const;

// --- API boundary schemas (validated with .parse on every response) ---

// POST /api/auth/login response — no token in the body (it is in the cookie).
export const LoginResponseSchema = z.object({
  displayName: z.string(),
  mustChangePassword: z.boolean(),
  payPalHandleSet: z.boolean(),
});

// POST /api/auth/register response — the new account; no session is issued, the
// user logs in afterward.
export const RegisterResponseSchema = z.object({
  userId: z.string(),
  username: z.string(),
  displayName: z.string(),
});

// GET /api/auth/me — hydrates the SPA session after reload/refresh.
export const SessionSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  firstName: z.string(),
  initials: z.string(),
  avatarColorHex: z.string(),
  role: z.string(),
  payPalHandleSet: z.boolean(),
  payPalHandle: z.string().nullable(),
  mustChangePassword: z.boolean(),
});

// --- Form schemas ---

// The user pastes the full PayPal link from their profile; the backend parses
// the handle out of it. Optional on registration, so empty input is allowed.
const PAYPAL_HOSTS = new Set(["paypal.me", "www.paypal.me", "paypal.com", "www.paypal.com"]);
const isPayPalLink = (value: string): boolean => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === "https:" && PAYPAL_HOSTS.has(url.hostname.toLowerCase());
};

export const LoginFormSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, "Pflichtfeld"),
  password: z.string().min(1, "Pflichtfeld"),
});

// Self-registration form. Field rules mirror the backend's validators so the
// user sees the failure inline before the request is sent; the backend remains
// the source of truth and a passed check here still gets re-validated there.
export const RegisterFormSchema = z
  .object({
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, authCopy.registerUsernameRequired)
      .pipe(
        z
          .string()
          .min(2, authCopy.registerUsernameLength)
          .max(64, authCopy.registerUsernameLength)
          .regex(/^[A-Za-z0-9._-]+$/, authCopy.registerUsernamePattern),
      ),
    displayName: z
      .string()
      .trim()
      .min(1, authCopy.registerDisplayNameRequired)
      .max(128, authCopy.registerDisplayNameLength),
    payPalHandle: z
      .string()
      .trim()
      .max(256, authCopy.registerPayPalHandleLength)
      .refine((value) => value === "" || isPayPalLink(value), authCopy.registerPayPalHandlePattern),
    password: z
      .string()
      .min(10, authCopy.registerPasswordLength)
      .regex(/[A-Za-z]/, authCopy.registerPasswordComplexity)
      .regex(/\d/, authCopy.registerPasswordComplexity),
    confirmPassword: z.string().min(1, authCopy.registerConfirmPasswordRequired),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: authCopy.registerPasswordMismatch,
  });
