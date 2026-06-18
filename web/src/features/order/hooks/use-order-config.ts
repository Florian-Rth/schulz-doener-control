import type { ProductKind } from "../types";

interface OrderConfig {
  kind: ProductKind | null;
  meatVisible: boolean;
  pizzaVisible: boolean;
}

// Derives the conditional-section visibility from the selected product's kind
// (the mock's isDoener / isPizza). Pure value-in/value-out — no effects.
export const useOrderConfig = (kind: ProductKind | null): OrderConfig => {
  return {
    kind,
    meatVisible: kind === "doener",
    pizzaVisible: kind === "pizza",
  };
};
