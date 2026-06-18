import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactElement } from "react";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  sx?: SxProps<Theme>;
}

// Generic single-select segmented control (e.g. Kalb | Hähnchen). Exactly one
// option is active at a time; the parent owns the value. Presentational only.
export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  sx,
}: SegmentedControlProps<T>): ReactElement => {
  return (
    <Stack direction="row" sx={[{ gap: 1.25 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <ButtonBase
            key={option.value}
            aria-pressed={active}
            onClick={() => {
              onChange(option.value);
            }}
            sx={(theme) => ({
              flex: 1,
              justifyContent: "center",
              py: 1.125,
              px: 1.75,
              borderRadius: `${theme.radii.pill}px`,
              fontWeight: 700,
              fontSize: "0.8125rem",
              border: "1.5px solid",
              borderColor: active ? theme.palette.primary.main : theme.ds.inputBorder,
              backgroundColor: active ? theme.palette.primary.main : "#FFFFFF",
              color: active ? theme.palette.primary.contrastText : theme.palette.label.main,
              transition: "all .12s",
            })}
          >
            {option.label}
          </ButtonBase>
        );
      })}
    </Stack>
  );
};
