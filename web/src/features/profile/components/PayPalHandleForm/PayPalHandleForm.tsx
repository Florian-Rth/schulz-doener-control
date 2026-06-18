import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { PrimaryButton } from "@/components";
import { profileCopy } from "../../copy";
import { usePayPalHandleForm } from "../../hooks/use-paypal-handle-form";
import { PayPalHandleField } from "./internal/PayPalHandleField";

interface PayPalHandleFormProps {
  /** The caller's existing handle (null = not yet set). Pre-fills the field. */
  initialHandle: string | null;
  /** Notified with the persisted handle after a successful save. */
  onSaved?: (handle: string) => void;
}

// View/set the caller's PayPal.Me handle — the gate for every payment link.
// Logic lives in `usePayPalHandleForm`; this body only composes field + CTA +
// status lines.
export const PayPalHandleForm: FC<PayPalHandleFormProps> = ({ initialHandle, onSaved }) => {
  const { form, onSubmit, isPending, isSaved, serverError } = usePayPalHandleForm({
    initialHandle,
    onSaved,
  });

  return (
    <Stack component="form" noValidate onSubmit={onSubmit} sx={{ gap: 0.5 }}>
      <Typography variant="eyebrow" sx={{ color: "primary.main" }}>
        {profileCopy.eyebrow}
      </Typography>
      <Typography sx={{ fontSize: "1.0625rem", fontWeight: 700, color: "navy.main" }}>
        {profileCopy.title}
      </Typography>
      <Typography sx={{ fontSize: "0.8125rem", color: "label.main", lineHeight: 1.5, mb: 0.5 }}>
        {profileCopy.intro}
      </Typography>

      <PayPalHandleField
        control={form.control}
        label={profileCopy.fieldLabel}
        placeholder={profileCopy.fieldPlaceholder}
      />

      {initialHandle === null ? (
        <Typography sx={{ fontSize: "0.75rem", color: "muted.main" }}>
          {profileCopy.gatedNotice}
        </Typography>
      ) : null}

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
          {profileCopy.saved}
        </Typography>
      ) : null}

      <PrimaryButton type="submit" loading={isPending} sx={{ mt: 1 }}>
        {isPending ? profileCopy.saving : profileCopy.submit}
      </PrimaryButton>
    </Stack>
  );
};
