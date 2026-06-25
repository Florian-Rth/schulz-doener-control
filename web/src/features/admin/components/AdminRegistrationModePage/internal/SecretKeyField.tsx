import TextField from "@mui/material/TextField";
import type { FC } from "react";
import { type Control, Controller } from "react-hook-form";
import { registrationCopy } from "../../../copy";
import type { RegistrationModeForm } from "../../../types";

interface SecretKeyFieldProps {
  control: Control<RegistrationModeForm>;
}

// RHF-controlled text input for the registration secret key. Shown only when SecretKeyOnly is the
// selected policy; the parent gates its visibility.
export const SecretKeyField: FC<SecretKeyFieldProps> = ({ control }) => {
  return (
    <Controller
      control={control}
      name="secretKey"
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          value={field.value ?? ""}
          onChange={(event) => field.onChange(event.target.value)}
          label={registrationCopy.secretKeyLabel}
          placeholder={registrationCopy.secretKeyPlaceholder}
          fullWidth
          error={fieldState.error !== undefined}
          helperText={fieldState.error?.message ?? registrationCopy.secretKeyHelper}
          slotProps={{ htmlInput: { autoComplete: "off" } }}
        />
      )}
    />
  );
};
