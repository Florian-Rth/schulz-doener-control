import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  type AddFieldOptionInput,
  type UpdateFieldOptionInput,
  useAddFieldOption,
  useUpdateFieldOption,
} from "../api";
import { FieldOptionFormSchema } from "../schemas";
import type { AdminFieldOption, FieldOptionForm } from "../types";
import { mapFieldError } from "./map-field-error";

interface UseFieldOptionFormOptions {
  /** The field the option belongs to. */
  fieldKey: string;
  /** The option being edited; when omitted the form provisions a new one. */
  option?: AdminFieldOption;
  /** Called after a successful create / update so the page can close the dialog. */
  onSaved: () => void;
}

interface UseFieldOptionFormResult {
  form: ReturnType<typeof useForm<FieldOptionForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  serverError: string | null;
  isEdit: boolean;
}

const emptyDefaults: FieldOptionForm = {
  key: "",
  label: "",
  icon: "",
  priceDeltaCents: 0,
  sortOrder: 0,
  isAvailable: true,
};

const toDefaults = (option: AdminFieldOption | undefined): FieldOptionForm => {
  if (option === undefined) {
    return emptyDefaults;
  }
  return {
    key: option.key,
    label: option.label,
    icon: option.icon ?? "",
    priceDeltaCents: option.priceDeltaCents,
    sortOrder: option.sortOrder,
    isAvailable: option.isAvailable,
  };
};

// Logic layer for the create/edit option dialog. Reuses one RHF + Zod form for both modes; on edit
// the key is immutable (shown read-only). An empty icon string becomes null on the wire.
export const useFieldOptionForm = ({
  fieldKey,
  option,
  onSaved,
}: UseFieldOptionFormOptions): UseFieldOptionFormResult => {
  const addMutation = useAddFieldOption();
  const updateMutation = useUpdateFieldOption();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = option !== undefined;

  const form = useForm<FieldOptionForm>({
    resolver: zodResolver(FieldOptionFormSchema),
    defaultValues: toDefaults(option),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    const icon = values.icon === "" ? null : values.icon;
    try {
      if (isEdit && option !== undefined) {
        const body: UpdateFieldOptionInput = {
          fieldKey,
          key: option.key,
          label: values.label,
          icon,
          priceDeltaCents: values.priceDeltaCents,
          sortOrder: values.sortOrder,
          isAvailable: values.isAvailable,
        };
        await updateMutation.mutateAsync(body);
      } else {
        const body: AddFieldOptionInput = {
          fieldKey,
          key: values.key,
          label: values.label,
          icon,
          priceDeltaCents: values.priceDeltaCents,
          sortOrder: values.sortOrder,
          isAvailable: values.isAvailable,
        };
        await addMutation.mutateAsync(body);
      }
      onSaved();
    } catch (error) {
      setServerError(mapFieldError(error, "save"));
    }
  });

  return {
    form,
    onSubmit,
    isPending: addMutation.isPending || updateMutation.isPending,
    serverError,
    isEdit,
  };
};
