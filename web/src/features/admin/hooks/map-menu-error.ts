import { ApiError } from "@/lib/api";
import { menuCopy } from "../copy";

// Translates a transport error from the menu-admin endpoints into a German
// inline message. On create a 409 means a duplicate id; a 400 is validation.
export const mapMenuError = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return menuCopy.errorDuplicate;
    }
    if (error.status === 400) {
      return menuCopy.errorValidation;
    }
  }
  return menuCopy.errorGeneric;
};
