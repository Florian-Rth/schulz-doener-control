import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { PrimaryButton } from "@/components";
import { settingsCopy } from "../../copy";
import { useWorkEmailForm } from "../../hooks/use-work-email-form";
import { WorkEmailField } from "./internal/WorkEmailField";

interface WorkEmailFormProps {
  /** The caller's current work email (null = none). Pre-fills the field. */
  initialEmail: string | null;
}

// View/edit the caller's optional work email — the address the order-list PDF is
// sent to. Logic lives in `useWorkEmailForm`; this body only composes field +
// helper + CTA + status lines. The save button is disabled until the field changes.
export const WorkEmailForm: FC<WorkEmailFormProps> = ({ initialEmail }) => {
  const { form, onSubmit, isPending, isSaved, serverError } = useWorkEmailForm({ initialEmail });
  const { isDirty } = form.formState;

  return (
    <Stack component="form" noValidate onSubmit={onSubmit} sx={{ gap: 0.5 }}>
      <WorkEmailField
        control={form.control}
        label={settingsCopy.workEmailLabel}
        placeholder={settingsCopy.workEmailPlaceholder}
      />

      <Typography sx={{ fontSize: "0.75rem", color: "muted.main" }}>
        {settingsCopy.workEmailHelper}
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
          {settingsCopy.workEmailSaved}
        </Typography>
      ) : null}

      <PrimaryButton type="submit" loading={isPending} disabled={!isDirty} sx={{ mt: 1 }}>
        {isPending ? settingsCopy.workEmailSaving : settingsCopy.workEmailSubmit}
      </PrimaryButton>
    </Stack>
  );
};
