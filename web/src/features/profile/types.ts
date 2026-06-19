import type { z } from "zod";
import type {
  ChangePasswordForcedFormSchema,
  ChangePasswordFormSchema,
  PayPalHandleFormSchema,
  PayPalHandleResponseSchema,
} from "./schemas";

export type PayPalHandleResponse = z.infer<typeof PayPalHandleResponseSchema>;
export type PayPalHandleForm = z.infer<typeof PayPalHandleFormSchema>;
export type ChangePasswordForm = z.infer<typeof ChangePasswordFormSchema>;
export type ChangePasswordForcedForm = z.infer<typeof ChangePasswordForcedFormSchema>;
