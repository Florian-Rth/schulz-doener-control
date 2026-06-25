import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { GhostButton, PrimaryButton } from "@/components";
import { pizzaVariantsCopy } from "../../../copy";
import { usePizzaVariantForm } from "../../../hooks/use-pizza-variant-form";
import type { AdminPizzaVariant } from "../../../types";
import { PizzaVariantIconField } from "./PizzaVariantIconField";
import { PizzaVariantTextField } from "./PizzaVariantTextField";
import { PizzaVariantToggleField } from "./PizzaVariantToggleField";

interface PizzaVariantDialogProps {
  open: boolean;
  /** The variant being edited; omit to provision a new one. */
  variant?: AdminPizzaVariant;
  onClose: () => void;
  onSaved: () => void;
}

// Create/edit pizza-variant dialog. One form serves both modes. Logic lives in
// `usePizzaVariantForm`; this composes the fields + actions.
export const PizzaVariantDialog: FC<PizzaVariantDialogProps> = ({
  open,
  variant,
  onClose,
  onSaved,
}) => {
  const { form, onSubmit, isPending, serverError, isEdit } = usePizzaVariantForm({
    variant,
    onSaved,
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "navy.main" }}>
        {isEdit ? pizzaVariantsCopy.editTitle : pizzaVariantsCopy.createTitle}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Stack component="form" noValidate onSubmit={onSubmit} sx={{ gap: 0.5, pt: 0.5 }}>
          <PizzaVariantTextField
            control={form.control}
            name="name"
            label={pizzaVariantsCopy.nameLabel}
            placeholder={pizzaVariantsCopy.namePlaceholder}
          />
          <PizzaVariantIconField control={form.control} />
          <PizzaVariantTextField
            control={form.control}
            name="sortOrder"
            label={pizzaVariantsCopy.sortOrderLabel}
            numeric
          />
          <PizzaVariantToggleField
            control={form.control}
            label={pizzaVariantsCopy.availableLabel}
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
                ? pizzaVariantsCopy.editSubmitting
                : pizzaVariantsCopy.editSubmit
              : isPending
                ? pizzaVariantsCopy.createSubmitting
                : pizzaVariantsCopy.createSubmit}
          </PrimaryButton>
          <GhostButton onClick={onClose} disabled={isPending} sx={{ mt: 1 }}>
            {pizzaVariantsCopy.cancel}
          </GhostButton>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
