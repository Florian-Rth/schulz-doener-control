import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { PrimaryButton } from "@/components";
import { settingsCopy } from "../../copy";
import { useDisplayNameForm } from "../../hooks/use-display-name-form";
import { DisplayNameField } from "./internal/DisplayNameField";

interface DisplayNameFormProps {
  /** The caller's current display name. Pre-fills the field. */
  initialName: string;
  /** Notified with the persisted name after a successful save. */
  onSaved?: (displayName: string) => void;
}

// View/edit the caller's display name. Logic lives in `useDisplayNameForm`;
// this body only composes field + helper + CTA + status lines. The save button
// is disabled until the field changes (and while a save is in flight).
export const DisplayNameForm: FC<DisplayNameFormProps> = ({ initialName, onSaved }) => {
  const { form, onSubmit, isPending, isSaved, serverError } = useDisplayNameForm({
    initialName,
    onSaved,
  });
  const { isDirty } = form.formState;

  return (
    <Stack component="form" noValidate onSubmit={onSubmit} sx={{ gap: 0.5 }}>
      <DisplayNameField
        control={form.control}
        label={settingsCopy.displayNameLabel}
        placeholder={settingsCopy.displayNamePlaceholder}
      />

      <Typography sx={{ fontSize: "0.75rem", color: "muted.main" }}>
        {settingsCopy.displayNameHelper}
      </Typography>

      {serverError !== null ? (
        <Typography
          role="alert"
          sx={{ fontSize: "0.8125rem", color: "primary.main", fontWeight: 600 }}
        >
          {serverError}
        </Typography>
      ) : null}

      {isSaved ? (
        <Typography
          role="status"
          sx={{ fontSize: "0.8125rem", color: "success.main", fontWeight: 700 }}
        >
          {settingsCopy.displayNameSaved}
        </Typography>
      ) : null}

      <PrimaryButton type="submit" loading={isPending} disabled={!isDirty} sx={{ mt: 1 }}>
        {isPending ? settingsCopy.displayNameSaving : settingsCopy.displayNameSubmit}
      </PrimaryButton>
    </Stack>
  );
};
