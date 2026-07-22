import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  type CreateFieldInput,
  type UpdateFieldInput,
  useCreateField,
  useUpdateField,
} from "../api";
import { FieldFormSchema } from "../schemas";
import type { AdminField, FieldForm } from "../types";
import { mapFieldError } from "./map-field-error";

interface UseFieldFormOptions {
  /** The field being edited; when omitted the form provisions a new one. */
  field?: AdminField;
  /** Called after a successful create / update so the page can close the dialog. */
  onSaved: () => void;
}

interface UseFieldFormResult {
  form: ReturnType<typeof useForm<FieldForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  serverError: string | null;
  isEdit: boolean;
}

const emptyDefaults: FieldForm = {
  key: "",
  label: "",
  type: "single",
  display: "segmented",
  maxLength: null,
};

const toDefaults = (field: AdminField | undefined): FieldForm => {
  if (field === undefined) {
    return emptyDefaults;
  }
  return {
    key: field.key,
    label: field.label,
    type: field.type,
    display: field.display,
    maxLength: field.maxLength,
  };
};

// Logic layer for the create/edit field dialog. Reuses one RHF + Zod form for both modes; on edit
// the key and type are immutable (shown read-only). `maxLength` is only sent for text fields.
export const useFieldForm = ({ field, onSaved }: UseFieldFormOptions): UseFieldFormResult => {
  const createMutation = useCreateField();
  const updateMutation = useUpdateField();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = field !== undefined;

  const form = useForm<FieldForm>({
    resolver: zodResolver(FieldFormSchema),
    defaultValues: toDefaults(field),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    const maxLength = values.type === "text" ? values.maxLength : null;
    try {
      if (isEdit && field !== undefined) {
        const body: UpdateFieldInput = {
          key: field.key,
          label: values.label,
          display: values.display,
          maxLength,
        };
        await updateMutation.mutateAsync(body);
      } else {
        const body: CreateFieldInput = {
          key: values.key,
          label: values.label,
          type: values.type,
          display: values.display,
          maxLength,
        };
        await createMutation.mutateAsync(body);
      }
      onSaved();
    } catch (error) {
      setServerError(mapFieldError(error, "save"));
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
