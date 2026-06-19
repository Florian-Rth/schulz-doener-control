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
import type { AdminMenuItem, MenuItemForm } from "../types";
import { mapMenuError } from "./map-menu-error";

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
  kind: "doener",
  materialIcon: "kebab_dining",
  note: "",
  isInsider: false,
  sortOrder: 0,
  isAvailable: true,
};

const toDefaults = (item: AdminMenuItem | undefined): MenuItemForm => {
  if (item === undefined) {
    return emptyDefaults;
  }
  return {
    id: item.id,
    name: item.name,
    priceCents: item.defaultPriceCents,
    kind: item.kind,
    materialIcon: item.materialIcon,
    note: item.note ?? "",
    isInsider: item.isInsider,
    sortOrder: item.sortOrder,
    isAvailable: item.isAvailable,
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
    try {
      if (isEdit && item !== undefined) {
        const body: UpdateMenuItemInput = {
          id: item.id,
          name: values.name,
          defaultPriceCents: values.priceCents,
          kind: values.kind,
          materialIcon: values.materialIcon,
          note,
          isInsider: values.isInsider,
          sortOrder: values.sortOrder,
          isAvailable: values.isAvailable,
        };
        await updateMutation.mutateAsync(body);
      } else {
        const body: CreateMenuItemInput = {
          id: values.id === "" ? undefined : values.id,
          name: values.name,
          defaultPriceCents: values.priceCents,
          kind: values.kind,
          materialIcon: values.materialIcon,
          note,
          isInsider: values.isInsider,
          sortOrder: values.sortOrder,
          isAvailable: values.isAvailable,
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
