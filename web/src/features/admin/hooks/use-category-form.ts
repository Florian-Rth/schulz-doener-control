import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  type CreateCategoryInput,
  type UpdateCategoryInput,
  useCreateCategory,
  useUpdateCategory,
} from "../api";
import { CategoryFormSchema } from "../schemas";
import type { AdminCategory, CategoryForm } from "../types";
import { mapCategoryError } from "./map-category-error";

interface UseCategoryFormOptions {
  /** The category being edited; when omitted the form provisions a new one. */
  category?: AdminCategory;
  /** Called after a successful create / update so the page can close the dialog. */
  onSaved: () => void;
}

interface UseCategoryFormResult {
  form: ReturnType<typeof useForm<CategoryForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  serverError: string | null;
  isEdit: boolean;
}

const emptyDefaults: CategoryForm = {
  key: "",
  name: "",
  sortOrder: 0,
  isAvailable: true,
};

const toDefaults = (category: AdminCategory | undefined): CategoryForm => {
  if (category === undefined) {
    return emptyDefaults;
  }
  return {
    key: category.key,
    name: category.name,
    sortOrder: category.sortOrder,
    isAvailable: category.isAvailable,
  };
};

// Logic layer for the create/edit category dialog. Reuses one RHF + Zod form for both modes; on edit
// the key is immutable (carried into the update payload from the path, shown read-only in the form).
export const useCategoryForm = ({
  category,
  onSaved,
}: UseCategoryFormOptions): UseCategoryFormResult => {
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = category !== undefined;

  const form = useForm<CategoryForm>({
    resolver: zodResolver(CategoryFormSchema),
    defaultValues: toDefaults(category),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      if (isEdit && category !== undefined) {
        const body: UpdateCategoryInput = {
          key: category.key,
          name: values.name,
          sortOrder: values.sortOrder,
          isAvailable: values.isAvailable,
        };
        await updateMutation.mutateAsync(body);
      } else {
        const body: CreateCategoryInput = {
          key: values.key,
          name: values.name,
          sortOrder: values.sortOrder,
          isAvailable: values.isAvailable,
        };
        await createMutation.mutateAsync(body);
      }
      onSaved();
    } catch (error) {
      setServerError(mapCategoryError(error, "save"));
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
