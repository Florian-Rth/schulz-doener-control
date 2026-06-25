import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { type Control, Controller } from "react-hook-form";
import { MaterialIcon } from "@/components";
import { pizzaVariantsCopy } from "../../../copy";
import type { PizzaVariantForm } from "../../../types";

interface PizzaVariantIconFieldProps {
  control: Control<PizzaVariantForm>;
}

// The pizza-relevant subset of the shared MaterialIcon iconMap offered as variant symbols. The
// leading "" choice clears the (optional) icon. Kept in sync with the bundled icon names; unknown
// values fall back to a neutral glyph at render time.
const ICON_CHOICES = [
  "local_pizza",
  "lunch_dining",
  "set_meal",
  "restaurant",
  "local_fire_department",
  "fastfood",
] as const;

// RHF-bound icon picker: a wrapping grid of the offered symbols plus a "no symbol" tile. The
// selected one is highlighted; tapping sets the form's `icon` string ("" = none).
export const PizzaVariantIconField: FC<PizzaVariantIconFieldProps> = ({ control }) => {
  return (
    <Controller
      control={control}
      name="icon"
      render={({ field }) => (
        <Stack sx={{ gap: 0.75 }}>
          <Typography
            component="span"
            sx={{ fontSize: "0.75rem", fontWeight: 600, color: "label.main" }}
          >
            {pizzaVariantsCopy.iconLabel}
          </Typography>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
            <ButtonBase
              aria-label="Kein Symbol"
              aria-pressed={field.value === ""}
              onClick={() => field.onChange("")}
              sx={(theme) => ({
                width: 48,
                height: 48,
                borderRadius: `${theme.radii.md}px`,
                border: `1.5px solid ${field.value === "" ? theme.palette.primary.main : theme.ds.inputBorder}`,
                backgroundColor:
                  field.value === "" ? theme.ds.greenTint : theme.palette.background.paper,
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              <MaterialIcon
                name="no_meals"
                sx={{ fontSize: 24, color: field.value === "" ? "primary.main" : "muted.main" }}
              />
            </ButtonBase>
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
