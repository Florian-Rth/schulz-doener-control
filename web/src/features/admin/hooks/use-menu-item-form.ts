import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  type CreateMenuItemInput,
  type UpdateMenuItemInput,
  useCreateMenuItem,
  useUpdateMenuItem,
} from "../api";
import { MenuItemFormSchema } from "../schemas";
import type { AdminAnswers, AdminMenuItem, MenuItemForm } from "../types";
import { mapMenuError } from "./map-menu-error";

// Strips empty answers (no chosen options, no text) and returns null when nothing
// meaningful remains, so a menu item without seeds sends `defaultAnswers: null`.
const normalizeAnswers = (answers: MenuItemForm["defaultAnswers"]): AdminAnswers | null => {
  const entries = Object.entries(answers).filter(
    (entry): entry is [string, AdminAnswers[string]] => {
      const value = entry[1];
      if (value === undefined) {
        return false;
      }
      const hasOptions = (value.options?.length ?? 0) > 0;
      const hasText = (value.text ?? "").trim() !== "";
      return hasOptions || hasText;
    },
  );
  return entries.length === 0 ? null : Object.fromEntries(entries);
};

interface UseMenuItemFormOptions {
  /** The item being edited; when omitted the form provisions a new item. */
  item?: AdminMenuItem;
  /** Called after a successful create / update so the page can close the dialog. */
  onSaved: () => void;
}

interface UseMenuItemFormResult {
  form: ReturnType<typeof useForm<MenuItemForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  serverError: string | null;
  isEdit: boolean;
}

const emptyDefaults: MenuItemForm = {
  id: "",
  name: "",
  priceCents: 0,
  categoryKey: "",
  baseItemId: "",
  materialIcon: "kebab_dining",
  note: "",
  isInsider: false,
  sortOrder: 0,
  isAvailable: true,
  defaultAnswers: {},
};

const toDefaults = (item: AdminMenuItem | undefined): MenuItemForm => {
  if (item === undefined) {
    return emptyDefaults;
  }
  return {
    id: item.id,
    name: item.name,
    priceCents: item.defaultPriceCents,
    categoryKey: item.categoryKey ?? "",
    baseItemId: item.baseItemId ?? "",
    materialIcon: item.materialIcon,
    note: item.note ?? "",
    isInsider: item.isInsider,
    sortOrder: item.sortOrder,
    isAvailable: item.isAvailable,
    defaultAnswers: item.defaultAnswers ?? {},
  };
};

// Logic layer for the create/edit menu dialog. Reuses one RHF + Zod form for
// both modes. The price is held as integer cents (the wire value); the price
// field component converts the German euro string. An empty note becomes
// `undefined` (omitted) on the wire.
export const useMenuItemForm = ({
  item,
  onSaved,
}: UseMenuItemFormOptions): UseMenuItemFormResult => {
  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = item !== undefined;

  const form = useForm<MenuItemForm>({
    resolver: zodResolver(MenuItemFormSchema),
    defaultValues: toDefaults(item),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    const note = values.note === "" ? undefined : values.note;
    const categoryKey = values.categoryKey === "" ? null : values.categoryKey;
    const baseItemId = values.baseItemId === "" ? null : values.baseItemId;
    // Seeds only make sense while a category is chosen; drop them otherwise.
    const defaultAnswers = categoryKey === null ? null : normalizeAnswers(values.defaultAnswers);
    try {
      if (isEdit && item !== undefined) {
        const body: UpdateMenuItemInput = {
          id: item.id,
          name: values.name,
          defaultPriceCents: values.priceCents,
          categoryKey,
          baseItemId,
          materialIcon: values.materialIcon,
          note,
          isInsider: values.isInsider,
          sortOrder: values.sortOrder,
          isAvailable: values.isAvailable,
          defaultAnswers,
        };
        await updateMutation.mutateAsync(body);
      } else {
        const body: CreateMenuItemInput = {
          id: values.id === "" ? undefined : values.id,
          name: values.name,
          defaultPriceCents: values.priceCents,
          categoryKey,
          baseItemId,
          materialIcon: values.materialIcon,
          note,
          isInsider: values.isInsider,
          sortOrder: values.sortOrder,
          isAvailable: values.isAvailable,
          defaultAnswers,
        };
        await createMutation.mutateAsync(body);
      }
      onSaved();
    } catch (error) {
      setServerError(mapMenuError(error));
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
