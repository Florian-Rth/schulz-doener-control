import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  type PizzaVariantBody,
  type UpdatePizzaVariantInput,
  useCreatePizzaVariant,
  useUpdatePizzaVariant,
} from "../api";
import { PizzaVariantFormSchema } from "../schemas";
import type { AdminPizzaVariant, PizzaVariantForm } from "../types";
import { mapPizzaVariantError } from "./map-pizza-variant-error";

interface UsePizzaVariantFormOptions {
  /** The variant being edited; when omitted the form provisions a new one. */
  variant?: AdminPizzaVariant;
  /** Called after a successful create / update so the page can close the dialog. */
  onSaved: () => void;
}

interface UsePizzaVariantFormResult {
  form: ReturnType<typeof useForm<PizzaVariantForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  serverError: string | null;
  isEdit: boolean;
}

const emptyDefaults: PizzaVariantForm = {
  name: "",
  icon: "",
  sortOrder: 0,
  isAvailable: true,
};

const toDefaults = (variant: AdminPizzaVariant | undefined): PizzaVariantForm => {
  if (variant === undefined) {
    return emptyDefaults;
  }
  return {
    name: variant.name,
    icon: variant.icon ?? "",
    sortOrder: variant.sortOrder,
    isAvailable: variant.isAvailable,
  };
};

// Logic layer for the create/edit pizza-variant dialog. Reuses one RHF + Zod form for both modes;
// on edit the id is carried separately into the update payload (the form has no id field). An empty
// icon string becomes `undefined` (omitted) on the wire.
export const usePizzaVariantForm = ({
  variant,
  onSaved,
}: UsePizzaVariantFormOptions): UsePizzaVariantFormResult => {
  const createMutation = useCreatePizzaVariant();
  const updateMutation = useUpdatePizzaVariant();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = variant !== undefined;

  const form = useForm<PizzaVariantForm>({
    resolver: zodResolver(PizzaVariantFormSchema),
    defaultValues: toDefaults(variant),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    const icon = values.icon === "" ? undefined : values.icon;
    try {
      if (isEdit && variant !== undefined) {
        const body: UpdatePizzaVariantInput = {
          id: variant.id,
          name: values.name,
          icon,
          sortOrder: values.sortOrder,
          isAvailable: values.isAvailable,
        };
        await updateMutation.mutateAsync(body);
      } else {
        const body: PizzaVariantBody = {
          name: values.name,
          icon,
          sortOrder: values.sortOrder,
          isAvailable: values.isAvailable,
        };
        await createMutation.mutateAsync(body);
      }
      onSaved();
    } catch (error) {
      setServerError(mapPizzaVariantError(error));
    }
  });

  return {
    form,
    onSubmit,
    isPending: createMutation.isPending || updateMutation.isPending,
    serverError,
    isEdit,
  };
};
