import Switch from "@mui/material/Switch";
import type { SxProps, Theme } from "@mui/material/styles";
import type { FC } from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible label for the switch (e.g. "Ich hole heute ab"). */
  ariaLabel: string;
  sx?: SxProps<Theme>;
}

// The Abholer switch: track + knob, red when on. MUI `Switch` styled to the
// mock's pill track/knob.
export const Toggle: FC<ToggleProps> = ({ checked, onChange, ariaLabel, sx }) => {
  return (
    <Switch
      checked={checked}
      onChange={(event) => {
        onChange(event.target.checked);
      }}
      slotProps={{ input: { "aria-label": ariaLabel } }}
      sx={[
        (theme) => ({
          width: 50,
          height: 30,
          padding: 0,
          "& .MuiSwitch-switchBase": {
            padding: "3px",
            "&.Mui-checked": {
              transform: "translateX(20px)",
              color: "#FFFFFF",
              "& + .MuiSwitch-track": {
                backgroundColor: theme.palette.primary.main,
                opacity: 1,
              },
            },
          },
          "& .MuiSwitch-thumb": {
            width: 24,
            height: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,.25)",
          },
          "& .MuiSwitch-track": {
            borderRadius: 15,
            backgroundColor: theme.ds.inputBorder,
            opacity: 1,
          },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
};
