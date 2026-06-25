import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { type Control, Controller } from "react-hook-form";
import { MaterialIcon } from "@/components";
import { registrationCopy } from "../../../copy";
import type { RegistrationModeForm, RegistrationModeNumber } from "../../../types";

interface ModeOption {
  value: RegistrationModeNumber;
  label: string;
  icon: string;
}

// The three policies, top to bottom. Long German labels make a vertical card list clearer than a
// horizontal segmented control on mobile.
const OPTIONS: readonly ModeOption[] = [
  { value: 1, label: registrationCopy.modeEnabled, icon: "lock_open" },
  { value: 2, label: registrationCopy.modeDisabled, icon: "lock" },
  { value: 3, label: registrationCopy.modeSecretKey, icon: "vpn_key" },
];

interface RegistrationModeFieldProps {
  control: Control<RegistrationModeForm>;
}

// RHF-controlled single-select for the registration policy: a vertical stack of selectable rows,
// the active one outlined in the brand red with a check. Presentational; the parent owns the value.
export const RegistrationModeField: FC<RegistrationModeFieldProps> = ({ control }) => {
  return (
    <Controller
      control={control}
      name="mode"
      render={({ field }) => (
        <Stack
          role="radiogroup"
          aria-label={registrationCopy.modeLabel}
          sx={{ gap: 1, width: "100%" }}
        >
          {OPTIONS.map((option) => {
            const active = field.value === option.value;
            return (
              <ButtonBase
                key={option.value}
                role="radio"
                aria-checked={active}
                onClick={() => field.onChange(option.value)}
                sx={(theme) => ({
                  width: "100%",
                  textAlign: "left",
                  p: 1.5,
                  borderRadius: `${theme.radii.lg}px`,
                  border: "1.5px solid",
                  borderColor: active ? theme.palette.primary.main : theme.ds.inputBorder,
                  backgroundColor: active ? "rgba(214,40,40,.06)" : theme.palette.background.paper,
                  transition: "all .12s",
                })}
              >
                <Stack direction="row" sx={{ alignItems: "center", gap: 1.25, width: "100%" }}>
                  <MaterialIcon
                    name={option.icon}
                    sx={{
                      fontSize: 22,
                      color: active ? "primary.main" : "label.main",
                    }}
                  />
                  <Typography
                    sx={{
                      flex: 1,
                      fontSize: "0.9375rem",
                      fontWeight: 700,
                      color: active ? "primary.main" : "navy.main",
                    }}
                  >
                    {option.label}
                  </Typography>
                  {active ? (
                    <MaterialIcon
                      name="check_circle"
                      sx={{ fontSize: 22, color: "primary.main" }}
                    />
                  ) : null}
                </Stack>
              </ButtonBase>
            );
          })}
        </Stack>
      )}
    />
  );
};
