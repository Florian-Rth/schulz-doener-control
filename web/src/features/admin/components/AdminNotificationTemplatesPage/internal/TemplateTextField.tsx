import TextField from "@mui/material/TextField";
import type { FC } from "react";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";

interface TemplateTextFieldProps<TForm extends FieldValues> {
  control: Control<TForm>;
  name: Path<TForm>;
  label: string;
  placeholder?: string;
  helperText?: string;
  /** When true the input grows to multiple lines (for the longer push body). */
  multiline?: boolean;
  minRows?: number;
}

// Presentational RHF-controlled text input for the notification-template form. Generic over the
// form shape; supports a multiline variant for the longer push body.
export const TemplateTextField = <TForm extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  helperText,
  multiline,
  minRows,
}: TemplateTextFieldProps<TForm>): ReturnType<FC> => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          value={field.value ?? ""}
          onChange={(event) => field.onChange(event.target.value)}
          label={label}
          placeholder={placeholder}
          multiline={multiline === true}
          minRows={multiline === true ? (minRows ?? 3) : undefined}
          fullWidth
          error={fieldState.error !== undefined}
          helperText={fieldState.error?.message ?? helperText ?? " "}
          slotProps={{ htmlInput: { autoComplete: "off" } }}
        />
      )}
    />
  );
};
