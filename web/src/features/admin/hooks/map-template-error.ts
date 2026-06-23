import { ApiError } from "@/lib/api";
import { templatesCopy } from "../copy";

// Translates a transport error from the notification-template endpoints into a German inline
// message. A 400 is validation; everything else is the generic fallback.
export const mapTemplateError = (error: unknown): string => {
  if (error instanceof ApiError && error.status === 400) {
    return templatesCopy.errorValidation;
  }
  return templatesCopy.errorGeneric;
};
