import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { GhostButton, PrimaryButton } from "@/components";
import { categoriesCopy } from "../../../copy";
import { useCategoryForm } from "../../../hooks/use-category-form";
import type { AdminCategory } from "../../../types";
import { CategoryFieldsEditor } from "./CategoryFieldsEditor";
import { CategoryTextField } from "./CategoryTextField";
import { CategoryToggleField } from "./CategoryToggleField";

interface CategoryDialogProps {
  open: boolean;
  /** The category being edited; omit to provision a new one. */
  category?: AdminCategory;
  onClose: () => void;
  onSaved: () => void;
}

// Create/edit category dialog. One form serves both modes; on edit the key is read-only and the
// field-assignment editor is shown (a category must exist before fields can be linked to it). Logic
// lives in `useCategoryForm`; the field editor owns its own save.
export const CategoryDialog: FC<CategoryDialogProps> = ({ open, category, onClose, onSaved }) => {
  const { form, onSubmit, isPending, serverError, isEdit } = useCategoryForm({ category, onSaved });

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "navy.main" }}>
        {isEdit ? categoriesCopy.editTitle : categoriesCopy.createTitle}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Stack component="form" noValidate onSubmit={onSubmit} sx={{ gap: 0.5, pt: 0.5 }}>
          <CategoryTextField
            control={form.control}
            name="key"
            label={categoriesCopy.keyLabel}
            placeholder={categoriesCopy.keyPlaceholder}
            helperText={isEdit ? categoriesCopy.keyLocked : undefined}
            disabled={isEdit}
          />
          <CategoryTextField
            control={form.control}
            name="name"
            label={categoriesCopy.nameLabel}
            placeholder={categoriesCopy.namePlaceholder}
          />
          <CategoryTextField
            control={form.control}
            name="sortOrder"
            label={categoriesCopy.sortOrderLabel}
            numeric
          />
          <CategoryToggleField
            control={form.control}
            name="isAvailable"
            label={categoriesCopy.availableLabel}
          />

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
                ? categoriesCopy.editSubmitting
                : categoriesCopy.editSubmit
              : isPending
                ? categoriesCopy.createSubmitting
                : categoriesCopy.createSubmit}
          </PrimaryButton>
          <GhostButton onClick={onClose} disabled={isPending} sx={{ mt: 1 }}>
            {categoriesCopy.cancel}
          </GhostButton>
        </Stack>

        {isEdit && category !== undefined ? <CategoryFieldsEditor category={category} /> : null}
      </DialogContent>
    </Dialog>
  );
};
