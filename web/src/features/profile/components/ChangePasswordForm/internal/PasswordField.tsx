import TextField from "@mui/material/TextField";
import type { FC } from "react";
import { type Control, Controller, type FieldPath } from "react-hook-form";
import type { ChangePasswordForm } from "../../../types";

interface PasswordFieldProps {
  control: Control<ChangePasswordForm>;
  name: FieldPath<ChangePasswordForm>;
  label: string;
  placeholder: string;
  autoComplete: "current-password" | "new-password";
}

// Presentational RHF-controlled password input for the change-password form.
export const PasswordField: FC<PasswordFieldProps> = ({
  control,
  name,
  label,
  placeholder,
  autoComplete,
}) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          label={label}
          placeholder={placeholder}
          type="password"
          fullWidth
          error={fieldState.error !== undefined}
          helperText={fieldState.error?.message ?? " "}
          slotProps={{
            htmlInput: { autoCapitalize: "none", autoComplete, spellCheck: false },
          }}
        />
      )}
    />
  );
};
