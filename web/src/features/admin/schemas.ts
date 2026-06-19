import { z } from "zod";

// --- API boundary schemas (validated with .parse on every response) ---

// One row of GET /api/admin/users. The backend emits PascalCase role values
// ("Admin" | "Employee") on the wire; we keep them as-is and normalise only
// when gating. `payPalHandle` is null when the colleague has not set one.
export const AdminUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  role: z.enum(["Admin", "Employee"]),
  isActive: z.boolean(),
  mustChangePassword: z.boolean(),
  payPalHandle: z.string().nullable(),
  createdAt: z.string(),
});

export const AdminUsersResponseSchema = z.object({
  users: z.array(AdminUserSchema),
});

// POST /api/admin/users → the temporary password is shown exactly once.
export const CreateUserResponseSchema = z.object({
  userId: z.string(),
  username: z.string(),
  temporaryPassword: z.string(),
});

// PUT /api/admin/users/{id} → the updated summary row.
export const UpdateUserResponseSchema = z.object({
  user: AdminUserSchema,
});

// POST /api/admin/users/{id}/reset-password → a fresh one-time password.
export const ResetPasswordResponseSchema = z.object({
  temporaryPassword: z.string(),
});

// --- Form schemas ---

// Shared validators mirroring the backend rules. The role select is a string in
// the form (radio/segmented control); it is mapped to the numeric request value
// (1 Employee / 2 Admin) at submit time.
const usernameField = z
  .string()
  .trim()
  .min(2, "Mindestens 2 Zeichen, Chef.")
  .max(64, "Höchstens 64 Zeichen.")
  .regex(/^[A-Za-z0-9._-]+$/, "Nur Buchstaben, Zahlen, Punkt, Bindestrich und Unterstrich.");

const displayNameField = z.string().trim().min(1, "Pflichtfeld").max(128, "Höchstens 128 Zeichen.");

// PayPal handle is optional; when present it must match the same charset the
// profile form enforces (no slashes/spaces so the paypal.me link stays valid).
const payPalHandleField = z
  .string()
  .trim()
  .max(40, "Höchstens 40 Zeichen.")
  .regex(/^[A-Za-z0-9]*$/, "Nur Buchstaben und Zahlen erlaubt (kein /, keine Leerzeichen).");

const roleField = z.enum(["Admin", "Employee"]);

export const CreateUserFormSchema = z.object({
  username: usernameField,
  displayName: displayNameField,
  payPalHandle: payPalHandleField,
  role: roleField,
});

export const EditUserFormSchema = z.object({
  displayName: displayNameField,
  payPalHandle: payPalHandleField,
  role: roleField,
  isActive: z.boolean(),
});
