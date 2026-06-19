import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { PrimaryButton } from "@/components";
import { changePasswordCopy } from "../../copy";
import { useChangePasswordForm } from "../../hooks/use-change-password-form";
import { PasswordField } from "./internal/PasswordField";

interface ChangePasswordFormProps {
  /** Where to route after a successful change. Defaults to the home dashboard. */
  redirectTo?: string;
}

// Set a new password — the forced first step for freshly provisioned accounts.
// Logic lives in `useChangePasswordForm`; this body only composes the fields,
// hint, CTA and the inline server-error line.
export const ChangePasswordForm: FC<ChangePasswordFormProps> = ({ redirectTo }) => {
  const { form, onSubmit, isPending, serverError, forced } = useChangePasswordForm({ redirectTo });

  return (
    <Stack component="form" noValidate onSubmit={onSubmit} sx={{ gap: 0.5 }}>
      <Typography variant="eyebrow" sx={{ color: "primary.main" }}>
        {changePasswordCopy.eyebrow}
      </Typography>
      <Typography sx={{ fontSize: "1.0625rem", fontWeight: 700, color: "navy.main" }}>
        {changePasswordCopy.title}
      </Typography>
      <Typography sx={{ fontSize: "0.8125rem", color: "label.main", lineHeight: 1.5, mb: 0.5 }}>
        {changePasswordCopy.intro}
      </Typography>

      {forced ? null : (
        <PasswordField
          control={form.control}
          name="currentPassword"
          label={changePasswordCopy.currentLabel}
          placeholder={changePasswordCopy.currentPlaceholder}
          autoComplete="current-password"
        />
      )}
      <PasswordField
        control={form.control}
        name="newPassword"
        label={changePasswordCopy.newLabel}
        placeholder={changePasswordCopy.newPlaceholder}
        autoComplete="new-password"
      />
      <PasswordField
        control={form.control}
        name="confirmNewPassword"
        label={changePasswordCopy.confirmLabel}
        placeholder={changePasswordCopy.confirmPlaceholder}
        autoComplete="new-password"
      />

      <Typography sx={{ fontSize: "0.75rem", color: "muted.main" }}>
        {changePasswordCopy.hint}
      </Typography>

      {serverError !== null ? (
        <Typography
          role="alert"
          sx={{ fontSize: "0.8125rem", color: "primary.main", fontWeight: 600 }}
        >
          {serverError}
        </Typography>
      ) : null}

      <PrimaryButton type="submit" loading={isPending} sx={{ mt: 1 }}>
        {isPending ? changePasswordCopy.saving : changePasswordCopy.submit}
      </PrimaryButton>
    </Stack>
  );
};
