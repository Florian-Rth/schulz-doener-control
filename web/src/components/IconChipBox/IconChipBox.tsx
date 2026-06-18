import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import type { FC, ReactNode } from "react";

type TintColor = "pink" | "green" | "orange" | "navy" | "subtle" | "none";

interface IconChipBoxProps {
  children: ReactNode;
  /** Background tint of the rounded tile. */
  tint?: TintColor;
  /** Edge length of the square tile, in theme spacing units. */
  size?: number;
  sx?: SxProps<Theme>;
}

const tintBackground = (theme: Theme, tint: TintColor): string => {
  switch (tint) {
    case "pink":
      return theme.palette.pinkTint.main;
    case "green":
      return theme.ds.greenTint;
    case "orange":
      return theme.ds.orangeTint;
    case "navy":
      return theme.palette.navy.main;
    case "subtle":
      return theme.palette.subtle.main;
    case "none":
      return "transparent";
  }
};

// The tinted rounded icon tile reused across the header, stat cards and the
// abholer rows. Purely presentational; the icon/glyph is the child.
export const IconChipBox: FC<IconChipBoxProps> = ({ children, tint = "pink", size = 4.75, sx }) => {
  return (
    <Stack
      sx={[
        (theme) => ({
          width: theme.spacing(size),
          height: theme.spacing(size),
          borderRadius: `${theme.radii.sm - 1}px`,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          backgroundColor: tintBackground(theme, tint),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Stack>
  );
};
