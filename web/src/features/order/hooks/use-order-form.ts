import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { type FieldErrors, useFieldArray, useForm, useWatch } from "react-hook-form";
import { ApiError } from "@/lib/api";
import { useDeleteMyOrder, useSubmitOrder } from "../api";
import { type Celebration, celebrationOf } from "../celebration";
import { orderCopy } from "../copy";
import { blankLine } from "../order-context";
import { buildOrderFormSchema } from "../schemas";
import type {
  AnswerValue,
  Category,
  Menu,
  MenuItem,
  MyOrder,
  OrderForm,
  OrderLineForm,
} from "../types";

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
  setAnswer: (index: number, fieldKey: string, value: AnswerValue) => void;
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
  /** Set once the order is saved — the Bestell-Feier plays before the success screen. */
  celebration: Celebration | null;
  /** Ends the Bestell-Feier and routes to the success screen. */
  finishCelebration: () => void;
}

interface PendingCelebration extends Celebration {
  orderId: string;
}

const MAX_LINES = 20;

// The category a product belongs to (via categoryKey), or undefined for a
// category-less product or an unknown key.
const resolveCategory = (menu: Menu, item: MenuItem): Category | undefined => {
  if (item.categoryKey === null) {
    return undefined;
  }
  return menu.categories.find((entry) => entry.key === item.categoryKey);
};

// The suggested per-unit price: the item base plus every selected option's
// price delta across all of the category's fields.
const computeSuggestedCents = (
  item: MenuItem,
  category: Category | undefined,
  answers: Record<string, AnswerValue>,
): number => {
  let cents = item.priceCents;
  if (category === undefined) {
    return cents;
  }
  for (const field of category.fields) {
    const selected = answers[field.key]?.options ?? [];
    for (const optionKey of selected) {
      const option = field.options.find((entry) => entry.key === optionKey);
      if (option !== undefined) {
        cents += option.priceDeltaCents;
      }
    }
  }
  return cents;
};

// Seeds a line's answers from the item's defaultAnswers, falling back to an
// empty answer per field (empty options for selects, empty text for text). A
// required single-select with no default stays empty and validation prompts.
const seedAnswers = (
  item: MenuItem,
  category: Category | undefined,
): Record<string, AnswerValue> => {
  const answers: Record<string, AnswerValue> = {};
  if (category === undefined) {
    return answers;
  }
  for (const field of category.fields) {
    const preset = item.defaultAnswers?.[field.key];
    if (preset !== undefined) {
      answers[field.key] = { ...preset };
    } else if (field.type === "text") {
      answers[field.key] = { text: "" };
    } else {
      answers[field.key] = { options: [] };
    }
  }
  return answers;
};

const buildDefaults = (existing: MyOrder | undefined): OrderForm => {
  const order = existing?.order ?? null;
  if (order === null || order.lines.length === 0) {
    return { lines: [blankLine()], isPickup: order?.isPickup ?? false };
  }
  const lines: OrderLineForm[] = order.lines.map((line) => ({
    productId: line.productId,
    answers: line.answers,
    priceCents: line.priceCents,
    quantity: line.quantity,
  }));
  return { lines, isPickup: order.isPickup };
};

// Logic layer for the order screen: RHF + Zod resolver over a LIST of lines
// (useFieldArray), defaults seeded from any existing order, per-line product
// auto-fill, a running order total, and the upsert submit that plays the
// Bestell-Feier and then routes to the success screen on the returned order id.
export const useOrderForm = ({ dayId, menu, existing }: UseOrderFormArgs): UseOrderFormResult => {
  const navigate = useNavigate();
  const submitMutation = useSubmitOrder();
  const deleteMutation = useDeleteMyOrder();
  const [serverError, setServerError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<PendingCelebration | null>(null);

  const form = useForm<OrderForm>({
    resolver: zodResolver(buildOrderFormSchema(menu)),
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
    const category = resolveCategory(menu, item);
    const answers = seedAnswers(item, category);
    form.setValue(`lines.${index}.productId`, item.id, { shouldValidate: true });
    form.setValue(`lines.${index}.answers`, answers, { shouldValidate: true });
    form.setValue(`lines.${index}.priceCents`, computeSuggestedCents(item, category, answers), {
      shouldValidate: true,
    });
  };

  // Writes one field's answer, then re-derives the line's suggested price from
  // the new answer set. The user can still override the price afterwards via the
  // PriceField; the next answer change re-derives it again (live price).
  const setAnswer = (index: number, fieldKey: string, value: AnswerValue): void => {
    form.setValue(`lines.${index}.answers.${fieldKey}`, value, { shouldValidate: true });
    const productId = form.getValues(`lines.${index}.productId`);
    const item = menu.items.find((entry) => entry.id === productId);
    if (item === undefined) {
      return;
    }
    const category = resolveCategory(menu, item);
    const answers = form.getValues(`lines.${index}.answers`);
    form.setValue(`lines.${index}.priceCents`, computeSuggestedCents(item, category, answers), {
      shouldValidate: true,
    });
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
      const ids: string[] = [];
      const answerErrors = lineError.answers;
      if (answerErrors !== undefined && answerErrors !== null) {
        for (const fieldKey of Object.keys(answerErrors)) {
          ids.push(`lines.${index}.answers.${fieldKey}-error`);
        }
      }
      ids.push(`lines.${index}.quantity-error`);
      for (const id of ids) {
        const node = document.getElementById(id);
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
        setCelebration({ orderId: result.id, ...celebrationOf(menu, values.lines) });
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

  const finishCelebration = (): void => {
    if (celebration === null) {
      return;
    }
    void navigate({ to: "/erledigt", search: { orderId: celebration.orderId } });
  };

  return {
    form,
    fields: fieldArray.fields,
    addLine,
    removeLine,
    canAddLine: fieldArray.fields.length < MAX_LINES,
    selectProduct,
    setAnswer,
    orderTotalCents,
    submitDisabled,
    isSubmitting: submitMutation.isPending,
    serverError,
    onSubmit,
    canRemove,
    removeOrder,
    isRemoving: deleteMutation.isPending,
    removeError,
    celebration,
    finishCelebration,
  };
};
