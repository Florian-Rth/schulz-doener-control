import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { type Control, Controller } from "react-hook-form";
import { profileCopy } from "../../../copy";
import type { PayPalHandleForm } from "../../../types";

interface PayPalHandleFieldProps {
  control: Control<PayPalHandleForm>;
  label: string;
  placeholder: string;
}

// Presentational RHF-controlled handle input with the `paypal.me/` prefix
// adornment, mirroring how the link is built.
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
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Typography sx={{ fontWeight: 600, color: "muted.main" }}>
                    {profileCopy.prefix}
                  </Typography>
                </InputAdornment>
              ),
            },
          }}
        />
      )}
    />
  );
};
