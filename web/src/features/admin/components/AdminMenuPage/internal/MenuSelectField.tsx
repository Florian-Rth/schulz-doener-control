import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { type FC, useId } from "react";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";

interface MenuSelectOption {
  value: string;
  label: string;
}

interface MenuSelectFieldProps<TForm extends FieldValues> {
  control: Control<TForm>;
  name: Path<TForm>;
  label: string;
  options: MenuSelectOption[];
  helperText?: string;
}

// Presentational RHF-controlled dropdown used for the menu form's category and
// base-item selects. The empty value ("") is a valid choice (= none) and is
// expected to be supplied as the first option by the caller.
export const MenuSelectField = <TForm extends FieldValues>({
  control,
  name,
  label,
  options,
  helperText,
}: MenuSelectFieldProps<TForm>): ReturnType<FC> => {
  const labelId = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormControl fullWidth error={fieldState.error !== undefined}>
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
