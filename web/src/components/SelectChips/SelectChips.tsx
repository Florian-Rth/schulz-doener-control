import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactElement } from "react";

interface SelectChipOption<T extends string> {
  value: T;
  label: string;
}

interface SelectChipsProps<T extends string> {
  options: readonly SelectChipOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  sx?: SxProps<Theme>;
}

// Generic single-select chip row (e.g. pizza variants). Active chip is red-fill
// with white text; the chips wrap onto multiple lines.
export const SelectChips = <T extends string>({
  options,
  value,
  onChange,
  sx,
}: SelectChipsProps<T>): ReactElement => {
  return (
    <Stack direction="row" sx={[{ gap: 1, flexWrap: "wrap" }, ...(Array.isArray(sx) ? sx : [sx])]}>
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
