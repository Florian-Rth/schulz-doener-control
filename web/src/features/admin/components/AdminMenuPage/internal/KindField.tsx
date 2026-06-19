import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { type Control, Controller } from "react-hook-form";
import { SegmentedControl } from "@/components";
import { menuCopy } from "../../../copy";
import type { MenuItemForm } from "../../../types";

interface KindFieldProps {
  control: Control<MenuItemForm>;
}

const kindOptions = [
  { value: "doener", label: menuCopy.kindDoener },
  { value: "pizza", label: menuCopy.kindPizza },
] as const;

// RHF-bound kind chooser: a "Döner | Pizza" segmented control. Stores the
// lower-case wire value directly.
export const KindField: FC<KindFieldProps> = ({ control }) => {
  return (
    <Controller
      control={control}
      name="kind"
      render={({ field }) => (
        <Stack sx={{ gap: 0.75 }}>
          <Typography
            component="span"
            sx={{ fontSize: "0.75rem", fontWeight: 600, color: "label.main" }}
          >
            {menuCopy.kindLabel}
          </Typography>
          <SegmentedControl
            options={kindOptions}
            value={field.value === "pizza" ? "pizza" : "doener"}
            onChange={field.onChange}
          />
        </Stack>
      )}
    />
  );
};
