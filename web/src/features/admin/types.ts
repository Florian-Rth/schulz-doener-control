import type { z } from "zod";
import type {
  AdminMenuItemSchema,
  AdminTiereResponseSchema,
  AdminTierSchema,
  AdminUserSchema,
  CreateUserFormSchema,
  CreateUserResponseSchema,
  EditUserFormSchema,
  MenuItemFormSchema,
  ResetPasswordResponseSchema,
} from "./schemas";

export type AdminUser = z.infer<typeof AdminUserSchema>;
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>;

export type CreateUserForm = z.infer<typeof CreateUserFormSchema>;
export type EditUserForm = z.infer<typeof EditUserFormSchema>;

export type AdminMenuItem = z.infer<typeof AdminMenuItemSchema>;
export type MenuItemForm = z.infer<typeof MenuItemFormSchema>;

export type AdminTier = z.infer<typeof AdminTierSchema>;
export type AdminTiere = z.infer<typeof AdminTiereResponseSchema>;

// The wire value of `kind` on menu requests/responses.
export type MenuKind = "doener" | "pizza";

// The wire value of `role` on create/update requests: 1 = Employee, 2 = Admin.
export type RoleNumber = 1 | 2;

// A one-time temporary password surfaced after create or reset, paired with the
// affected user's display name for the copyable warning box.
export interface TempPasswordReveal {
  displayName: string;
  temporaryPassword: string;
}
