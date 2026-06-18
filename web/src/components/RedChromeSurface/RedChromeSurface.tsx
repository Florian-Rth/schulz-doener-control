import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import type { FC, ReactNode } from "react";
import { Schraege, type SchraegeVariant } from "./internal/Schraege";

interface RedChromeSurfaceProps {
  /** Leading slot — icon box or back button. */
  start?: ReactNode;
  /** Trailing slot — LIVE pill or count. */
  end?: ReactNode;
  /** Title block. */
  children?: ReactNode;
  /** Which Schräge polygon to use. */
  clipVariant?: SchraegeVariant;
  /** Render on the navy surface variant (lighter overlay, navy background). */
  surface?: "red" | "navy";
  /** Parent-controlled positioning. */
  sx?: SxProps<Theme>;
}

// The red `#C90023` chrome card with the Schräge bevel overlay. A slot shell:
// arranges `start` / `children` / `end` over the bevel; holds no business
// logic and sets no positioning margin of its own (parent controls via `sx`).
export const RedChromeSurface: FC<RedChromeSurfaceProps> = ({
  start,
  end,
  children,
  clipVariant = "default",
  surface = "red",
  sx,
}) => {
  return (
    <Stack
      direction="row"
      sx={[
        (theme) => ({
          position: "relative",
          overflow: "hidden",
          alignItems: "center",
          gap: 1.5,
          px: 2.25,
          py: 2,
          borderRadius: `${theme.radii.xl}px`,
          backgroundColor:
            surface === "navy" ? theme.palette.navy.main : theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          boxShadow: surface === "navy" ? "none" : "0 6px 18px rgba(201,0,35,.22)",
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Schraege variant={clipVariant} light={surface === "navy"} />
      {start !== undefined ? (
        <Stack sx={{ position: "relative", zIndex: 1, flexShrink: 0 }}>{start}</Stack>
      ) : null}
      <Stack sx={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0 }}>{children}</Stack>
      {end !== undefined ? (
        <Stack sx={{ position: "relative", zIndex: 1, flexShrink: 0 }}>{end}</Stack>
      ) : null}
    </Stack>
  );
};
