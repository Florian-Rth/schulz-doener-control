import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { GhostButton, PrimaryButton } from "@/components";
import { useAdminCategories, useAdminFields, useAdminMenu } from "../../../api";
import { menuCopy } from "../../../copy";
import { useMenuItemForm } from "../../../hooks/use-menu-item-form";
import type { AdminMenuItem } from "../../../types";
import { DefaultAnswersEditor } from "./DefaultAnswersEditor";
import { IconField } from "./IconField";
import { MenuPriceField } from "./MenuPriceField";
import { MenuSelectField } from "./MenuSelectField";
import { MenuTextField } from "./MenuTextField";
import { MenuToggleField } from "./MenuToggleField";

interface MenuItemDialogProps {
  open: boolean;
  /** The item being edited; omit to provision a new one. */
  item?: AdminMenuItem;
  onClose: () => void;
  onSaved: () => void;
}

// Create/edit menu-item dialog. One form serves both modes; on edit the id is
// immutable and shown read-only. Logic lives in `useMenuItemForm`; this composes
// the fields + actions. The category / base-item selects and the default-answers
// editor are driven by the categories + fields engine queries.
export const MenuItemDialog: FC<MenuItemDialogProps> = ({ open, item, onClose, onSaved }) => {
  const { form, onSubmit, isPending, serverError, isEdit } = useMenuItemForm({ item, onSaved });
  const categoriesQuery = useAdminCategories();
  const fieldsQuery = useAdminFields();
  const menuQuery = useAdminMenu();

  const categories = categoriesQuery.data ?? [];
  const fields = fieldsQuery.data ?? [];

  const categoryOptions = [
    { value: "", label: menuCopy.categoryNone },
    ...categories.map((category) => ({ value: category.key, label: category.name })),
  ];
  const baseItemOptions = [
    { value: "", label: menuCopy.baseItemNone },
    ...(menuQuery.data ?? [])
      .filter((entry) => entry.id !== item?.id)
      .map((entry) => ({ value: entry.id, label: entry.name })),
  ];

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "navy.main" }}>
        {isEdit ? menuCopy.editTitle : menuCopy.createTitle}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Stack component="form" noValidate onSubmit={onSubmit} sx={{ gap: 0.5, pt: 0.5 }}>
          {isEdit && item !== undefined ? (
            <Typography sx={{ fontSize: "0.75rem", color: "muted.main" }}>
              {menuCopy.idLabel}: <strong>{item.id}</strong>
            </Typography>
          ) : (
            <MenuTextField
              control={form.control}
              name="id"
              label={menuCopy.idLabel}
              placeholder={menuCopy.idPlaceholder}
              helperText={menuCopy.idHint}
            />
          )}

          <MenuTextField
            control={form.control}
            name="name"
            label={menuCopy.nameLabel}
            placeholder={menuCopy.namePlaceholder}
          />
          <MenuPriceField form={form} />
          <MenuSelectField
            control={form.control}
            name="categoryKey"
            label={menuCopy.categoryLabel}
            options={categoryOptions}
          />
          <MenuSelectField
            control={form.control}
            name="baseItemId"
            label={menuCopy.baseItemLabel}
            options={baseItemOptions}
            helperText={menuCopy.baseItemHint}
          />
          <DefaultAnswersEditor form={form} categories={categories} fields={fields} />
          <IconField control={form.control} />
          <MenuTextField
            control={form.control}
            name="note"
            label={menuCopy.noteLabel}
            placeholder={menuCopy.notePlaceholder}
          />
          <MenuTextField
            control={form.control}
            name="sortOrder"
            label={menuCopy.sortOrderLabel}
            numeric
          />
          <MenuToggleField
            control={form.control}
            name="isAvailable"
            label={menuCopy.availableLabel}
          />
          <MenuToggleField control={form.control} name="isInsider" label={menuCopy.insiderLabel} />

          {serverError !== null ? (
            <Typography
              role="alert"
              sx={{ fontSize: "0.8125rem", color: "primary.main", fontWeight: 600, mt: 1 }}
            >
              {serverError}
            </Typography>
          ) : null}

          <PrimaryButton type="submit" loading={isPending} sx={{ mt: 1.5 }}>
            {isEdit
              ? isPending
                ? menuCopy.editSubmitting
                : menuCopy.editSubmit
              : isPending
                ? menuCopy.createSubmitting
                : menuCopy.createSubmit}
          </PrimaryButton>
          <GhostButton onClick={onClose} disabled={isPending} sx={{ mt: 1 }}>
            {menuCopy.cancel}
          </GhostButton>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
