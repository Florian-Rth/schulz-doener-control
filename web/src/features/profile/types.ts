import type { z } from "zod";
import type {
  ChangePasswordForcedFormSchema,
  ChangePasswordFormSchema,
  DisplayNameFormSchema,
  DisplayNameResponseSchema,
  PayPalHandleFormSchema,
  PayPalHandleResponseSchema,
  WorkEmailFormSchema,
  WorkEmailResponseSchema,
} from "./schemas";

export type PayPalHandleResponse = z.infer<typeof PayPalHandleResponseSchema>;
export type PayPalHandleForm = z.infer<typeof PayPalHandleFormSchema>;
export type DisplayNameResponse = z.infer<typeof DisplayNameResponseSchema>;
export type DisplayNameForm = z.infer<typeof DisplayNameFormSchema>;
export type WorkEmailResponse = z.infer<typeof WorkEmailResponseSchema>;
export type WorkEmailForm = z.infer<typeof WorkEmailFormSchema>;
export type ChangePasswordForm = z.infer<typeof ChangePasswordFormSchema>;
export type ChangePasswordForcedForm = z.infer<typeof ChangePasswordForcedFormSchema>;
