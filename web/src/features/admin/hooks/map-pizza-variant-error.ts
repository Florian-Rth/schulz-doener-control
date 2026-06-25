import { ApiError } from "@/lib/api";
import { pizzaVariantsCopy } from "../copy";

// Translates a transport error from the pizza-variant endpoints into a German inline message. On
// create a 409 means a duplicate name; a 400 is validation; everything else is the generic fallback.
export const mapPizzaVariantError = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return pizzaVariantsCopy.errorDuplicate;
    }
    if (error.status === 400) {
      return pizzaVariantsCopy.errorValidation;
    }
  }
  return pizzaVariantsCopy.errorGeneric;
};
