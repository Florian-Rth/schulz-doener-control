import { createContext, useContext } from "react";
import type { useFieldArray, useForm } from "react-hook-form";
import type { Celebration } from "./celebration";
import type { AnswerValue, Field, Menu, OrderForm, OrderLineForm } from "./types";

export interface OrderFormContextValue {
  form: ReturnType<typeof useForm<OrderForm>>;
  menu: Menu;
  /** The RHF field-array entries (one per order line). */
  fields: ReturnType<typeof useFieldArray<OrderForm, "lines", "key">>["fields"];
  /** Append a fresh blank line (capped at 20). */
  addLine: () => void;
  /** Remove the line at `index` (no-op when only one line remains). */
  removeLine: (index: number) => void;
  /** True while more lines can still be added. */
  canAddLine: boolean;
  /** Seed a line's product, default answers and suggested price from the menu. */
  selectProduct: (index: number, productId: string) => void;
  /** Write one field's answer and recompute the line's suggested price. */
  setAnswer: (index: number, fieldKey: string, value: AnswerValue) => void;
  /** Running order total in integer cents (sum of quantity * priceCents). */
  orderTotalCents: number;
  /** True until every line has a product chosen (submit disabled). */
  submitDisabled: boolean;
  isSubmitting: boolean;
  serverError: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  /** True when an order already exists for this day (so it can be withdrawn). */
  canRemove: boolean;
  /** Withdraws the existing order, then routes back to the dashboard. */
  removeOrder: () => void;
  isRemoving: boolean;
  removeError: string | null;
  /** Set once the order is saved — the Bestell-Feier plays before the success screen. */
  celebration: Celebration | null;
  /** Ends the Bestell-Feier and routes to the success screen. */
  finishCelebration: () => void;
}

export const OrderFormContext = createContext<OrderFormContextValue | null>(null);

// One context for the order compound group. Throws outside the provider to make
// missing-wrapper bugs loud.
export const useOrderFormContext = (): OrderFormContextValue => {
  const value = useContext(OrderFormContext);
  if (value === null) {
    throw new Error("useOrderFormContext muss innerhalb von <OrderFormProvider> verwendet werden.");
  }
  return value;
};

export interface OrderLineContextValue {
  /** This line's index in the field array — drives every `lines.${index}.*` name. */
  index: number;
  /** The selected product's category fields, in render order; empty until a product is picked. */
  fields: Field[];
}

export const OrderLineContext = createContext<OrderLineContextValue | null>(null);

// Per-line context: every field component reads `index` from here to address
// its own `lines.${index}.*` RHF field. Throws outside the provider.
export const useOrderLineContext = (): OrderLineContextValue => {
  const value = useContext(OrderLineContext);
  if (value === null) {
    throw new Error("useOrderLineContext muss innerhalb von <OrderLineProvider> verwendet werden.");
  }
  return value;
};

// A blank line for the field array — no product, empty answers, quantity 1,
// sentinel price 1 so an untouched line fails the positive() check until a
// product seeds it.
export const blankLine = (): OrderLineForm => ({
  productId: "",
  answers: {},
  priceCents: 1,
  quantity: 1,
});
