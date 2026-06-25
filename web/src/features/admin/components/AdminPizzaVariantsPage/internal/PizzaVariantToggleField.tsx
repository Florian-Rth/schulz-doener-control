import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { type Control, Controller } from "react-hook-form";
import { Toggle } from "@/components";
import type { PizzaVariantForm } from "../../../types";

interface PizzaVariantToggleFieldProps {
  control: Control<PizzaVariantForm>;
  label: string;
}

// RHF-bound on/off switch for the variant's `isAvailable` flag. Presentational; the form owns the
// value.
export const PizzaVariantToggleField: FC<PizzaVariantToggleFieldProps> = ({ control, label }) => {
  return (
    <Controller
      control={control}
      name="isAvailable"
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
