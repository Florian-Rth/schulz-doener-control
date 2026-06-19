import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";

interface UserTextFieldProps<TForm extends FieldValues> {
  control: Control<TForm>;
  name: Path<TForm>;
  label: string;
  placeholder?: string;
  /** Optional fixed prefix shown as a start adornment (e.g. "paypal.me/"). */
  prefix?: string;
  disabled?: boolean;
}

// Presentational RHF-controlled text input used across the user create/edit
// forms. Generic over the form shape so both dialogs reuse it.
export const UserTextField = <TForm extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  prefix,
  disabled,
}: UserTextFieldProps<TForm>): ReturnType<FC> => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          label={label}
          placeholder={placeholder}
          fullWidth
          disabled={disabled}
          error={fieldState.error !== undefined}
          helperText={fieldState.error?.message ?? " "}
          slotProps={{
            htmlInput: { autoCapitalize: "none", autoComplete: "off", spellCheck: false },
            input:
              prefix !== undefined
                ? {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography sx={{ fontWeight: 600, color: "muted.main" }}>
                          {prefix}
                        </Typography>
                      </InputAdornment>
                    ),
                  }
                : undefined,
          }}
        />
      )}
    />
  );
};
