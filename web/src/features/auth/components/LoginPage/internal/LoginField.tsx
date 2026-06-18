import TextField from "@mui/material/TextField";
import type { FC } from "react";
import { type Control, Controller, type FieldPath } from "react-hook-form";
import type { LoginForm } from "../../../types";

interface LoginFieldProps {
  control: Control<LoginForm>;
  name: FieldPath<LoginForm>;
  label: string;
  placeholder: string;
  type?: "text" | "password";
  autoComplete: string;
}

// Presentational RHF-controlled text field matching the mock's login inputs.
export const LoginField: FC<LoginFieldProps> = ({
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
