import TextField from "@mui/material/TextField";
import type { FC } from "react";
import { type Control, Controller } from "react-hook-form";
import type { WorkEmailForm } from "../../../types";

interface WorkEmailFieldProps {
  control: Control<WorkEmailForm>;
  label: string;
  placeholder: string;
}

// Presentational RHF-controlled work-email input.
export const WorkEmailField: FC<WorkEmailFieldProps> = ({ control, label, placeholder }) => {
  return (
    <Controller
      control={control}
      name="workEmail"
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          label={label}
          placeholder={placeholder}
          type="email"
          fullWidth
          error={fieldState.error !== undefined}
          helperText={fieldState.error?.message ?? " "}
          slotProps={{
            htmlInput: { autoCapitalize: "none", autoComplete: "email", spellCheck: false },
          }}
        />
      )}
    />
  );
};
