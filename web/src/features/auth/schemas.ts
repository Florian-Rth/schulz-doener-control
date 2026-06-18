import { z } from "zod";

// --- API boundary schemas (validated with .parse on every response) ---

// POST /api/auth/login response — no token in the body (it is in the cookie).
export const LoginResponseSchema = z.object({
  displayName: z.string(),
  mustChangePassword: z.boolean(),
  payPalHandleSet: z.boolean(),
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

export const LoginFormSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, "Pflichtfeld"),
  password: z.string().min(1, "Pflichtfeld"),
});
