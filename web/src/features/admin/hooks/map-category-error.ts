import { ApiError } from "@/lib/api";
import { categoriesCopy } from "../copy";

// Translates a transport error from the category endpoints into a German inline message. On save a
// 409 means a duplicate key; on delete a 409 means a menu item still references the category. A 400
// is validation; everything else is the generic fallback.
export const mapCategoryError = (error: unknown, context: "save" | "delete" = "save"): string => {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return context === "delete" ? categoriesCopy.errorReferenced : categoriesCopy.errorDuplicate;
    }
    if (error.status === 400) {
      return categoriesCopy.errorValidation;
    }
  }
  return categoriesCopy.errorGeneric;
};
