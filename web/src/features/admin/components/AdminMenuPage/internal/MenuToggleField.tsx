import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { type Control, Controller, type FieldPath } from "react-hook-form";
import { Toggle } from "@/components";
import type { MenuItemForm } from "../../../types";

// The boolean fields on the menu form that render as a switch.
type BooleanFieldName = Extract<FieldPath<MenuItemForm>, "isInsider" | "isAvailable">;

interface MenuToggleFieldProps {
  control: Control<MenuItemForm>;
  name: BooleanFieldName;
  label: string;
}

// RHF-bound on/off switch for the menu form's boolean fields (insider /
// available). Presentational; the form owns the value.
export const MenuToggleField: FC<MenuToggleFieldProps> = ({ control, name, label }) => {
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
