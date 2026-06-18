import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactElement } from "react";

interface ChipOption<T extends string> {
  value: T;
  label: string;
  emoji?: string;
}

interface MultiSelectChipsProps<T extends string> {
  options: readonly ChipOption<T>[];
  value: readonly T[];
  onToggle: (value: T) => void;
  sx?: SxProps<Theme>;
}

// Generic multi-select chip row (e.g. sauces). Any number of chips can be
// active at once; toggling an active chip clears it. Pink-tinted when active.
export const MultiSelectChips = <T extends string>({
  options,
  value,
  onToggle,
  sx,
}: MultiSelectChipsProps<T>): ReactElement => {
  return (
    <Stack
      direction="row"
      sx={[{ gap: 1.25, flexWrap: "wrap" }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {options.map((option) => {
        const active = value.includes(option.value);
        return (
          <ButtonBase
            key={option.value}
            aria-pressed={active}
            onClick={() => {
              onToggle(option.value);
            }}
            sx={(theme) => ({
              gap: 0.75,
              py: 1.125,
              px: 1.75,
              borderRadius: `${theme.radii.pill}px`,
              fontWeight: 700,
              fontSize: "0.8125rem",
              border: "1.5px solid",
              borderColor: active ? theme.palette.primary.main : theme.ds.inputBorder,
              backgroundColor: active ? theme.palette.pinkTint.main : "#FFFFFF",
              color: active ? theme.palette.primary.main : theme.palette.label.main,
              transition: "all .12s",
            })}
          >
            {option.emoji !== undefined ? (
              <span aria-hidden style={{ fontSize: "1rem" }}>
                {option.emoji}
              </span>
            ) : null}
            {option.label}
          </ButtonBase>
        );
      })}
    </Stack>
  );
};
