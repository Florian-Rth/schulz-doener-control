import TextField from "@mui/material/TextField";
import type { FC } from "react";
import { type Control, Controller, type FieldPath } from "react-hook-form";
import type { RegisterForm } from "../../../types";

interface RegisterFieldProps {
  control: Control<RegisterForm>;
  name: FieldPath<RegisterForm>;
  label: string;
  placeholder: string;
  type?: "text" | "password";
  autoComplete: string;
}

// Presentational RHF-controlled text field for the registration form. Mirrors
// LoginField (including the helperText spacing trick that reserves a row so the
// layout does not jump when an inline error appears).
export const RegisterField: FC<RegisterFieldProps> = ({
  control,
  name,
  label,
  placeholder,
  type = "text",
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
          type={type}
          fullWidth
          error={fieldState.error !== undefined}
          helperText={fieldState.error?.message ?? " "}
          slotProps={{
            htmlInput: { autoCapitalize: "none", autoComplete },
          }}
        />
      )}
    />
  );
};
