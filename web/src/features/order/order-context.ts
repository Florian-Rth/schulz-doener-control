import { createContext, useContext } from "react";
import type { useForm } from "react-hook-form";
import type { Menu, OrderForm, ProductKind } from "./types";

export interface OrderFormContextValue {
  form: ReturnType<typeof useForm<OrderForm>>;
  menu: Menu;
  /** Derived from the selected product's kind — drives the conditional fields. */
  kind: ProductKind | null;
  meatVisible: boolean;
  pizzaVisible: boolean;
  /** True until a product is chosen (mock parity — submit disabled). */
  submitDisabled: boolean;
  isSubmitting: boolean;
  serverError: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  selectProduct: (productId: string) => void;
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
