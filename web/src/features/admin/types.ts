import type { z } from "zod";
import type {
  AdminUserSchema,
  CreateUserFormSchema,
  CreateUserResponseSchema,
  EditUserFormSchema,
  ResetPasswordResponseSchema,
} from "./schemas";

export type AdminUser = z.infer<typeof AdminUserSchema>;
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>;

export type CreateUserForm = z.infer<typeof CreateUserFormSchema>;
export type EditUserForm = z.infer<typeof EditUserFormSchema>;

// The wire value of `role` on create/update requests: 1 = Employee, 2 = Admin.
export type RoleNumber = 1 | 2;

// A one-time temporary password surfaced after create or reset, paired with the
// affected user's display name for the copyable warning box.
export interface TempPasswordReveal {
  displayName: string;
  temporaryPassword: string;
}
