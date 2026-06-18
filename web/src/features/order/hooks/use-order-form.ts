import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/lib/api";
import { useSubmitOrder } from "../api";
import { orderCopy } from "../copy";
import { OrderFormSchema } from "../schemas";
import type { Menu, MyOrder, OrderForm, ProductKind } from "../types";
import { useOrderConfig } from "./use-order-config";

interface UseOrderFormArgs {
  dayId: string;
  menu: Menu;
  existing: MyOrder | undefined;
}

interface UseOrderFormResult {
  form: ReturnType<typeof useForm<OrderForm>>;
  kind: ProductKind | null;
  meatVisible: boolean;
  pizzaVisible: boolean;
  submitDisabled: boolean;
  isSubmitting: boolean;
  serverError: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  selectProduct: (productId: string) => void;
}

const buildDefaults = (existing: MyOrder | undefined): OrderForm => {
  const order = existing?.order ?? null;
  if (order === null) {
    return {
      productId: "",
      kind: "doener",
      meat: null,
      pizzaVariant: null,
      sauces: [],
      extra: "",
      priceCents: 1,
      isPickup: false,
    };
  }
  return {
    productId: order.productId,
    kind: order.kind,
    meat: order.meat,
    pizzaVariant: order.pizzaVariant,
    sauces: order.sauces,
    extra: order.extra ?? "",
    priceCents: order.priceCents,
    isPickup: order.isPickup,
  };
};

// Logic layer for the order screen: RHF + Zod resolver, defaults seeded from the
// menu + any existing order, the kind-derived conditional visibility, and the
// upsert submit that routes to the success screen on the returned order id.
export const useOrderForm = ({ dayId, menu, existing }: UseOrderFormArgs): UseOrderFormResult => {
  const navigate = useNavigate();
  const submitMutation = useSubmitOrder();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<OrderForm>({
    resolver: zodResolver(OrderFormSchema),
    defaultValues: buildDefaults(existing),
  });

  const productId = form.watch("productId");
  const kind = form.watch("kind");
  const config = useOrderConfig(productId === "" ? null : kind);

  const selectProduct = (nextProductId: string): void => {
    const item = menu.items.find((entry) => entry.id === nextProductId);
    if (item === undefined) {
      return;
    }
    form.setValue("productId", item.id, { shouldValidate: true });
    form.setValue("kind", item.kind, { shouldValidate: true });
    form.setValue("priceCents", item.defaultPriceCents, { shouldValidate: true });
    if (item.kind === "pizza") {
      form.setValue("meat", null, { shouldValidate: true });
      form.setValue("sauces", [], { shouldValidate: true });
    } else {
      form.setValue("pizzaVariant", null, { shouldValidate: true });
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
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
  });

  return {
    form,
    kind: config.kind,
    meatVisible: config.meatVisible,
    pizzaVisible: config.pizzaVisible,
    submitDisabled: productId === "",
    isSubmitting: submitMutation.isPending,
    serverError,
    onSubmit,
    selectProduct,
  };
};
