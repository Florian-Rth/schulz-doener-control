import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { type FieldErrors, useFieldArray, useForm, useWatch } from "react-hook-form";
import { ApiError } from "@/lib/api";
import { useDeleteMyOrder, useSubmitOrder } from "../api";
import { orderCopy } from "../copy";
import { blankLine } from "../order-context";
import { OrderFormSchema } from "../schemas";
import type { Menu, MyOrder, OrderForm, OrderLineForm } from "../types";

interface UseOrderFormArgs {
  dayId: string;
  menu: Menu;
  existing: MyOrder | undefined;
}

interface UseOrderFormResult {
  form: ReturnType<typeof useForm<OrderForm>>;
  fields: ReturnType<typeof useFieldArray<OrderForm, "lines", "key">>["fields"];
  addLine: () => void;
  removeLine: (index: number) => void;
  canAddLine: boolean;
  selectProduct: (index: number, productId: string) => void;
  orderTotalCents: number;
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

const MAX_LINES = 20;

const buildDefaults = (existing: MyOrder | undefined): OrderForm => {
  const order = existing?.order ?? null;
  if (order === null || order.lines.length === 0) {
    return { lines: [blankLine()], isPickup: order?.isPickup ?? false };
  }
  const lines: OrderLineForm[] = order.lines.map((line) => ({
    productId: line.productId,
    kind: line.kind,
    meat: line.meat,
    pizzaVariant: line.pizzaVariant,
    sauces: line.sauces,
    extra: line.extra ?? "",
    priceCents: line.priceCents,
    quantity: line.quantity,
  }));
  return { lines, isPickup: order.isPickup };
};

// Logic layer for the order screen: RHF + Zod resolver over a LIST of lines
// (useFieldArray), defaults seeded from any existing order, per-line product
// auto-fill, a running order total, and the upsert submit that routes to the
// success screen on the returned order id.
export const useOrderForm = ({ dayId, menu, existing }: UseOrderFormArgs): UseOrderFormResult => {
  const navigate = useNavigate();
  const submitMutation = useSubmitOrder();
  const deleteMutation = useDeleteMyOrder();
  const [serverError, setServerError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const form = useForm<OrderForm>({
    resolver: zodResolver(OrderFormSchema),
    defaultValues: buildDefaults(existing),
  });

  const fieldArray = useFieldArray<OrderForm, "lines", "key">({
    control: form.control,
    name: "lines",
    keyName: "key",
  });

  // useWatch (not form.watch) so the running total + submit-gate recompute under
  // the React Compiler, which would otherwise not re-render on form.watch().
  const lines = useWatch({ control: form.control, name: "lines" });

  const selectProduct = (index: number, nextProductId: string): void => {
    const item = menu.items.find((entry) => entry.id === nextProductId);
    if (item === undefined) {
      return;
    }
    form.setValue(`lines.${index}.productId`, item.id, { shouldValidate: true });
    form.setValue(`lines.${index}.kind`, item.kind, { shouldValidate: true });
    form.setValue(`lines.${index}.priceCents`, item.defaultPriceCents, { shouldValidate: true });
    if (item.kind === "pizza") {
      form.setValue(`lines.${index}.meat`, null, { shouldValidate: true });
      form.setValue(`lines.${index}.sauces`, [], { shouldValidate: true });
    } else {
      form.setValue(`lines.${index}.pizzaVariant`, null, { shouldValidate: true });
    }
  };

  const addLine = (): void => {
    if (fieldArray.fields.length >= MAX_LINES) {
      return;
    }
    fieldArray.append(blankLine());
  };

  const removeLine = (index: number): void => {
    if (fieldArray.fields.length <= 1) {
      return;
    }
    fieldArray.remove(index);
  };

  const orderTotalCents = lines.reduce(
    (sum, line) => sum + (line.priceCents ?? 0) * (line.quantity ?? 0),
    0,
  );
  const submitDisabled = lines.some((line) => line.productId === "");

  // shouldFocusError (default true) focuses the first focusable invalid input
  // (Preis / Extra). The selector controls (Fleisch / Pizza / Soße) are not
  // focusable, so on a blocked submit scroll their first error caption into view
  // — guarded for jsdom where scrollIntoView is unimplemented.
  const scrollToFirstError = (errors: FieldErrors<OrderForm>): void => {
    const lineErrors = errors.lines;
    if (!Array.isArray(lineErrors)) {
      return;
    }
    for (let index = 0; index < lineErrors.length; index += 1) {
      const lineError = lineErrors[index];
      if (lineError === undefined || lineError === null) {
        continue;
      }
      for (const fieldKey of Object.keys(lineError)) {
        const node = document.getElementById(`lines.${index}.${fieldKey}-error`);
        if (node !== null && typeof node.scrollIntoView === "function") {
          node.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
      }
    }
  };

  const onSubmit = form.handleSubmit(
    async (values) => {
      setServerError(null);
      try {
        const result = await submitMutation.mutateAsync({ dayId, values });
        await navigate({ to: "/erledigt", search: { orderId: result.id } });
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          setServerError(orderCopy.cutoffPassed);
          return;
        }
        setServerError(orderCopy.submitFailed);
      }
    },
    (errors) => {
      scrollToFirstError(errors);
    },
  );

  const canRemove = (existing?.order ?? null) !== null;

  const removeOrder = (): void => {
    setRemoveError(null);
    void (async (): Promise<void> => {
      try {
        await deleteMutation.mutateAsync(dayId);
        await navigate({ to: "/" });
      } catch {
        setRemoveError(orderCopy.removeFailed);
      }
    })();
  };

  return {
    form,
    fields: fieldArray.fields,
    addLine,
    removeLine,
    canAddLine: fieldArray.fields.length < MAX_LINES,
    selectProduct,
    orderTotalCents,
    submitDisabled,
    isSubmitting: submitMutation.isPending,
    serverError,
    onSubmit,
    canRemove,
    removeOrder,
    isRemoving: deleteMutation.isPending,
    removeError,
  };
};
