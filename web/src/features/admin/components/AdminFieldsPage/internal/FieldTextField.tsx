import TextField from "@mui/material/TextField";
import type { FC } from "react";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";

interface FieldTextFieldProps<TForm extends FieldValues> {
  control: Control<TForm>;
  name: Path<TForm>;
  label: string;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  /** When true the typed value is coerced to an integer (or null when blank) on change. */
  numeric?: boolean;
  /** For numeric fields, whether a blank input becomes null instead of NaN. */
  nullable?: boolean;
}

// Presentational RHF-controlled text input for the field / option forms. Generic over the form
// shape. When `numeric`, the typed value is parsed to an integer; `nullable` blanks map to null
// (used by the optional maxLength field) rather than NaN.
export const FieldTextField = <TForm extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  helperText,
  disabled,
  numeric,
  nullable,
}: FieldTextFieldProps<TForm>): ReturnType<FC> => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          value={field.value ?? ""}
          onChange={(event) => {
            if (numeric === true) {
              const raw = event.target.value.trim();
              if (raw === "") {
                field.onChange(nullable === true ? null : Number.NaN);
                return;
              }
              field.onChange(Number(raw));
              return;
            }
            field.onChange(event.target.value);
          }}
          type={numeric === true ? "number" : "text"}
          label={label}
          placeholder={placeholder}
          disabled={disabled === true}
          fullWidth
          error={fieldState.error !== undefined}
          helperText={fieldState.error?.message ?? helperText ?? " "}
          slotProps={{
            htmlInput: { autoCapitalize: "none", autoComplete: "off", spellCheck: false },
          }}
        />
      )}
    />
  );
};
