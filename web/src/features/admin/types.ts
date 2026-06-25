import type { z } from "zod";
import type {
  AdminMenuItemSchema,
  AdminNotificationTemplateSchema,
  AdminPizzaVariantSchema,
  AdminRegistrationModeResponseSchema,
  AdminTiereResponseSchema,
  AdminTierSchema,
  AdminUserSchema,
  CreateUserFormSchema,
  CreateUserResponseSchema,
  EditUserFormSchema,
  MenuItemFormSchema,
  NotificationTemplateFormSchema,
  PizzaVariantFormSchema,
  RegistrationModeFormSchema,
  ResetPasswordResponseSchema,
} from "./schemas";

export type AdminUser = z.infer<typeof AdminUserSchema>;
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>;

export type CreateUserForm = z.infer<typeof CreateUserFormSchema>;
export type EditUserForm = z.infer<typeof EditUserFormSchema>;

export type AdminMenuItem = z.infer<typeof AdminMenuItemSchema>;
export type MenuItemForm = z.infer<typeof MenuItemFormSchema>;

export type AdminNotificationTemplate = z.infer<typeof AdminNotificationTemplateSchema>;
export type NotificationTemplateForm = z.infer<typeof NotificationTemplateFormSchema>;

export type AdminPizzaVariant = z.infer<typeof AdminPizzaVariantSchema>;
export type PizzaVariantForm = z.infer<typeof PizzaVariantFormSchema>;

export type AdminTier = z.infer<typeof AdminTierSchema>;
export type AdminTiere = z.infer<typeof AdminTiereResponseSchema>;

export type AdminRegistrationMode = z.infer<typeof AdminRegistrationModeResponseSchema>;
export type RegistrationModeForm = z.infer<typeof RegistrationModeFormSchema>;

// The wire value of the registration policy: 1 = Enabled, 2 = Disabled, 3 = SecretKeyOnly.
export type RegistrationModeNumber = 1 | 2 | 3;

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
