import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { GhostButton, PrimaryButton } from "@/components";
import { fieldsCopy } from "../../../copy";
import { useFieldOptionForm } from "../../../hooks/use-field-option-form";
import type { AdminFieldOption } from "../../../types";
import { FieldOptionPriceField } from "./FieldOptionPriceField";
import { FieldTextField } from "./FieldTextField";
import { FieldToggleField } from "./FieldToggleField";

interface FieldOptionDialogProps {
  open: boolean;
  /** The field the option belongs to. */
  fieldKey: string;
  /** The option being edited; omit to provision a new one. */
  option?: AdminFieldOption;
  onClose: () => void;
  onSaved: () => void;
}

// Create/edit option dialog for one field. One form serves both modes; on edit the key is read-only.
// Logic lives in `useFieldOptionForm`; the price is entered in euros and stored as integer cents.
export const FieldOptionDialog: FC<FieldOptionDialogProps> = ({
  open,
  fieldKey,
  option,
  onClose,
  onSaved,
}) => {
  const { form, onSubmit, isPending, serverError, isEdit } = useFieldOptionForm({
    fieldKey,
    option,
    onSaved,
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "navy.main" }}>
        {isEdit ? fieldsCopy.optionEditTitle : fieldsCopy.optionCreateTitle}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Stack component="form" noValidate onSubmit={onSubmit} sx={{ gap: 0.5, pt: 0.5 }}>
          <FieldTextField
            control={form.control}
            name="key"
            label={fieldsCopy.optionKeyLabel}
            placeholder={fieldsCopy.optionKeyPlaceholder}
            helperText={isEdit ? fieldsCopy.keyLocked : undefined}
            disabled={isEdit}
          />
          <FieldTextField
            control={form.control}
            name="label"
            label={fieldsCopy.optionLabelLabel}
            placeholder={fieldsCopy.optionLabelPlaceholder}
          />
          <FieldTextField
            control={form.control}
            name="icon"
            label={fieldsCopy.optionIconLabel}
            placeholder={fieldsCopy.optionIconPlaceholder}
          />
          <FieldOptionPriceField form={form} />
          <FieldTextField
            control={form.control}
            name="sortOrder"
            label={fieldsCopy.optionSortOrderLabel}
            numeric
          />
          <FieldToggleField
            control={form.control}
            name="isAvailable"
            label={fieldsCopy.optionAvailableLabel}
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
                ? fieldsCopy.editSubmitting
                : fieldsCopy.editSubmit
              : isPending
                ? fieldsCopy.createSubmitting
                : fieldsCopy.createSubmit}
          </PrimaryButton>
          <GhostButton onClick={onClose} disabled={isPending} sx={{ mt: 1 }}>
            {fieldsCopy.cancel}
          </GhostButton>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
