import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { type Control, Controller } from "react-hook-form";
import { MaterialIcon } from "@/components";
import { menuCopy } from "../../../copy";
import type { MenuItemForm } from "../../../types";

interface IconFieldProps {
  control: Control<MenuItemForm>;
}

// The food-relevant subset of the shared MaterialIcon iconMap offered as menu
// symbols. Kept in sync with the bundled `ICON_MAP` names; unknown values would
// fall back to a neutral glyph at render time.
const ICON_CHOICES = [
  "kebab_dining",
  "local_pizza",
  "lunch_dining",
  "fastfood",
  "takeout_dining",
  "set_meal",
  "restaurant",
  "local_fire_department",
  "no_meals",
] as const;

// RHF-bound icon picker: a wrapping grid of the offered symbols. The selected
// one is highlighted; tapping any sets the form's `materialIcon` string.
export const IconField: FC<IconFieldProps> = ({ control }) => {
  return (
    <Controller
      control={control}
      name="materialIcon"
      render={({ field }) => (
        <Stack sx={{ gap: 0.75 }}>
          <Typography
            component="span"
            sx={{ fontSize: "0.75rem", fontWeight: 600, color: "label.main" }}
          >
            {menuCopy.iconLabel}
          </Typography>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
            {ICON_CHOICES.map((icon) => {
              const active = field.value === icon;
              return (
                <ButtonBase
                  key={icon}
                  aria-label={icon}
                  aria-pressed={active}
                  onClick={() => field.onChange(icon)}
                  sx={(theme) => ({
                    width: 48,
                    height: 48,
                    borderRadius: `${theme.radii.md}px`,
                    border: `1.5px solid ${active ? theme.palette.primary.main : theme.ds.inputBorder}`,
                    backgroundColor: active ? theme.ds.greenTint : theme.palette.background.paper,
                    alignItems: "center",
                    justifyContent: "center",
                  })}
                >
                  <MaterialIcon
                    name={icon}
                    sx={{ fontSize: 24, color: active ? "primary.main" : "muted.main" }}
                  />
                </ButtonBase>
              );
            })}
          </Stack>
        </Stack>
      )}
    />
  );
};
