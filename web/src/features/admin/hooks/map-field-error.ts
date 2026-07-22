import { ApiError } from "@/lib/api";
import { fieldsCopy } from "../copy";

// Translates a transport error from the field / option endpoints into a German inline message.
// On save a 409 means a duplicate key and a 400 is validation. On delete a 409 means the field is
// still referenced by a category and a 400 means the field / option is reserved for the Tier engine.
export const mapFieldError = (error: unknown, context: "save" | "delete" = "save"): string => {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return context === "delete" ? fieldsCopy.errorReferenced : fieldsCopy.errorDuplicate;
    }
    if (error.status === 400) {
      return context === "delete" ? fieldsCopy.errorReserved : fieldsCopy.errorValidation;
    }
  }
  return fieldsCopy.errorGeneric;
};
