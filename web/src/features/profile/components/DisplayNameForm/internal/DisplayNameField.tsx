import TextField from "@mui/material/TextField";
import type { FC } from "react";
import { type Control, Controller } from "react-hook-form";
import type { DisplayNameForm } from "../../../types";

interface DisplayNameFieldProps {
  control: Control<DisplayNameForm>;
  label: string;
  placeholder: string;
}

// Presentational RHF-controlled display-name input.
export const DisplayNameField: FC<DisplayNameFieldProps> = ({ control, label, placeholder }) => {
  return (
    <Controller
      control={control}
      name="displayName"
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          label={label}
          placeholder={placeholder}
          fullWidth
          error={fieldState.error !== undefined}
          helperText={fieldState.error?.message ?? " "}
          slotProps={{
            htmlInput: { autoComplete: "name", spellCheck: false },
          }}
        />
      )}
    />
  );
};
