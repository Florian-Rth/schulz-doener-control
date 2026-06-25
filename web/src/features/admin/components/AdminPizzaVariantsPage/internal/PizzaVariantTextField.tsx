import TextField from "@mui/material/TextField";
import type { FC } from "react";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";

interface PizzaVariantTextFieldProps<TForm extends FieldValues> {
  control: Control<TForm>;
  name: Path<TForm>;
  label: string;
  placeholder?: string;
  helperText?: string;
  /** When true the typed value is coerced to an integer on change (for sortOrder). */
  numeric?: boolean;
}

// Presentational RHF-controlled text input for the pizza-variant create/edit form. Generic over the
// form shape. When `numeric`, the typed value is parsed to an integer so the Zod number field
// validates correctly.
export const PizzaVariantTextField = <TForm extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  helperText,
  numeric,
}: PizzaVariantTextFieldProps<TForm>): ReturnType<FC> => {
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
