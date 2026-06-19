import { ApiError } from "@/lib/api";
import { usersCopy } from "../copy";

// Translates a transport error from the user-admin endpoints into a German
// inline message. The 409 meaning differs by operation: on create it is a
// duplicate username, on update/deactivate it is the last-active-admin guard.
export const mapCreateError = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return usersCopy.errorDuplicate;
    }
    if (error.status === 400) {
      return usersCopy.errorValidation;
    }
  }
  return usersCopy.errorGeneric;
};

export const mapUpdateError = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return usersCopy.errorLastAdmin;
    }
    if (error.status === 400) {
      return usersCopy.errorValidation;
    }
  }
  return usersCopy.errorGeneric;
};
