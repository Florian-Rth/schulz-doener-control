import TextField from "@mui/material/TextField";
import type { FC } from "react";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";

interface CategoryTextFieldProps<TForm extends FieldValues> {
  control: Control<TForm>;
  name: Path<TForm>;
  label: string;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  /** When true the typed value is coerced to an integer on change (for sortOrder). */
  numeric?: boolean;
}

// Presentational RHF-controlled text input for the category create/edit form. Generic over the form
// shape. When `numeric`, the typed value is parsed to an integer so the Zod number field validates.
export const CategoryTextField = <TForm extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  helperText,
  disabled,
  numeric,
}: CategoryTextFieldProps<TForm>): ReturnType<FC> => {
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
              field.onChange(raw === "" ? Number.NaN : Number(raw));
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
