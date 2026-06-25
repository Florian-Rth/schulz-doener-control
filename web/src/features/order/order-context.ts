import { createContext, useContext } from "react";
import type { useFieldArray, useForm } from "react-hook-form";
import type { Menu, OrderForm, OrderLineForm, ProductKind } from "./types";

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
  /** Seed a line's product, kind and default price from the menu. */
  selectProduct: (index: number, productId: string) => void;
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
  /** Derived from the line's selected product kind; null until a product is picked. */
  kind: ProductKind | null;
  meatVisible: boolean;
  pizzaVisible: boolean;
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

// A blank line for the field array — döner default, quantity 1, sentinel price 1
// so an untouched line fails the positive() check until a product seeds it.
export const blankLine = (): OrderLineForm => ({
  productId: "",
  kind: "doener",
  meat: null,
  pizzaVariant: null,
  sauces: [],
  extra: "",
  priceCents: 1,
  quantity: 1,
});
