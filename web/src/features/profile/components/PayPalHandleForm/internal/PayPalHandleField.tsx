import TextField from "@mui/material/TextField";
import type { FC } from "react";
import { type Control, Controller } from "react-hook-form";
import type { PayPalHandleForm } from "../../../types";

interface PayPalHandleFieldProps {
  control: Control<PayPalHandleForm>;
  label: string;
  placeholder: string;
}

// Presentational RHF-controlled input for the full PayPal link (the user pastes
// the complete URL — no prefix adornment).
export const PayPalHandleField: FC<PayPalHandleFieldProps> = ({ control, label, placeholder }) => {
  return (
    <Controller
      control={control}
      name="handle"
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          label={label}
          placeholder={placeholder}
          fullWidth
          error={fieldState.error !== undefined}
          helperText={fieldState.error?.message ?? " "}
          slotProps={{
            htmlInput: { autoCapitalize: "none", autoComplete: "off", spellCheck: false },
          }}
        />
      )}
    />
  );
};
