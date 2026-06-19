import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { type Control, Controller } from "react-hook-form";
import { Toggle } from "@/components";
import { usersCopy } from "../../../copy";
import type { EditUserForm } from "../../../types";

interface ActiveFieldProps {
  control: Control<EditUserForm>;
}

// RHF-bound active/inactive switch for the edit dialog.
export const ActiveField: FC<ActiveFieldProps> = ({ control }) => {
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
            {usersCopy.activeLabel}
          </Typography>
          <Toggle
            checked={field.value}
            onChange={field.onChange}
            ariaLabel={usersCopy.activeLabel}
          />
        </Stack>
      )}
    />
  );
};
