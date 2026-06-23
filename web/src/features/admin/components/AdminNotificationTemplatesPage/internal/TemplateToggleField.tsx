import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { type Control, Controller } from "react-hook-form";
import { Toggle } from "@/components";
import type { NotificationTemplateForm } from "../../../types";

interface TemplateToggleFieldProps {
  control: Control<NotificationTemplateForm>;
  label: string;
}

// RHF-bound on/off switch for the template's `isActive` flag. Presentational; the form owns the
// value.
export const TemplateToggleField: FC<TemplateToggleFieldProps> = ({ control, label }) => {
  return (
    <Controller
      control={control}
      name="isActive"
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
