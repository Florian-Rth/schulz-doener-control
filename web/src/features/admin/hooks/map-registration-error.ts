import { ApiError } from "@/lib/api";
import { registrationCopy } from "../copy";

// Translates a transport error from the registration-mode endpoint into a German inline message. A
// 400 is validation; everything else is the generic fallback.
export const mapRegistrationError = (error: unknown): string => {
  if (error instanceof ApiError && error.status === 400) {
    return registrationCopy.errorValidation;
  }
  return registrationCopy.errorGeneric;
};
