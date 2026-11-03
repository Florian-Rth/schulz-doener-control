import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";
import { Toggle } from "@/components";

interface CategoryToggleFieldProps<TForm extends FieldValues> {
  control: Control<TForm>;
  name: Path<TForm>;
  label: string;
}

// RHF-bound on/off switch for a boolean form field. Presentational; the form owns the value.
export const CategoryToggleField = <TForm extends FieldValues>({
  control,
  name,
  label,
}: CategoryToggleFieldProps<TForm>): ReturnType<FC> => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", py: 0.5 }}
        >
          <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "navy.main" }}>
            {label}
          </Typography>
          <Toggle checked={Boolean(field.value)} onChange={field.onChange} ariaLabel={label} />
        </Stack>
      )}
    />
  );
};
