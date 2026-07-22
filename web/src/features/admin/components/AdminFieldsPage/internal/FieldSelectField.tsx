import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { type FC, useId } from "react";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";

interface FieldSelectOption {
  value: string;
  label: string;
}

interface FieldSelectFieldProps<TForm extends FieldValues> {
  control: Control<TForm>;
  name: Path<TForm>;
  label: string;
  options: readonly FieldSelectOption[];
  disabled?: boolean;
  helperText?: string;
}

// Presentational RHF-controlled dropdown for the field form's type / display selects. On edit the
// type is locked via `disabled`.
export const FieldSelectField = <TForm extends FieldValues>({
  control,
  name,
  label,
  options,
  disabled,
  helperText,
}: FieldSelectFieldProps<TForm>): ReturnType<FC> => {
  const labelId = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormControl fullWidth error={fieldState.error !== undefined} disabled={disabled === true}>
          <InputLabel id={labelId}>{label}</InputLabel>
          <Select
            labelId={labelId}
            label={label}
            value={field.value ?? ""}
            onChange={(event) => {
              field.onChange(event.target.value);
            }}
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>{fieldState.error?.message ?? helperText ?? " "}</FormHelperText>
        </FormControl>
      )}
    />
  );
};
