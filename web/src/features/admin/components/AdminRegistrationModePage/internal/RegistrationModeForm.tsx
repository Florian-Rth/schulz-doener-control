import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { useState } from "react";
import { PrimaryButton, PushToast } from "@/components";
import { registrationCopy } from "../../../copy";
import { useRegistrationModeForm } from "../../../hooks/use-registration-mode-form";
import type { RegistrationModeNumber } from "../../../types";
import { RegistrationModeField } from "./RegistrationModeField";
import { SecretKeyField } from "./SecretKeyField";

interface RegistrationModeFormProps {
  initialMode: RegistrationModeNumber;
  initialSecretKey: string | null;
}

// The registration-mode editor, mounted once the GET has resolved (so its RHF defaults are the
// loaded values). Composes the mode selector, the conditional secret-key field, the save button and
// a dismissible success toast. A render-phase update — not an effect — reveals the toast when a save
// completes, avoiding a commit-phase flicker.
export const RegistrationModeForm: FC<RegistrationModeFormProps> = ({
  initialMode,
  initialSecretKey,
}) => {
  const { form, onSubmit, showSecretKey, isPending, isSaved, serverError } =
    useRegistrationModeForm({ initialMode, initialSecretKey });

  const [toastVisible, setToastVisible] = useState(false);
  const [prevSaved, setPrevSaved] = useState(isSaved);
  if (isSaved !== prevSaved) {
    setPrevSaved(isSaved);
    if (isSaved) {
      setToastVisible(true);
    }
  }

  return (
    <Stack
      component="form"
      noValidate
      onSubmit={onSubmit}
      sx={{ gap: 1.5, width: "100%", textAlign: "left" }}
    >
      {toastVisible ? (
        <PushToast
          message={registrationCopy.saveSuccess}
          onDismiss={() => setToastVisible(false)}
        />
      ) : null}

      <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "label.main", px: 0.25 }}>
        {registrationCopy.modeLabel}
      </Typography>

      <RegistrationModeField control={form.control} />

      {showSecretKey ? <SecretKeyField control={form.control} /> : null}

      {serverError !== null ? (
        <Typography
          role="alert"
          sx={{ fontSize: "0.8125rem", color: "primary.main", fontWeight: 600 }}
        >
          {serverError}
        </Typography>
      ) : null}

      <PrimaryButton type="submit" loading={isPending} sx={{ mt: 0.5 }}>
        {isPending ? registrationCopy.saving : registrationCopy.saveButton}
      </PrimaryButton>
    </Stack>
  );
};
