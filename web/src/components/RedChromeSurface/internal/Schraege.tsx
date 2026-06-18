import Box from "@mui/material/Box";
import type { FC } from "react";

export type SchraegeVariant = "default" | "deep";

interface SchraegeProps {
  variant?: SchraegeVariant;
  /** When true, use the lighter overlay (navy surfaces); else the dark one. */
  light?: boolean;
}

// The absolutely-positioned bevel overlay that gives every Schulz surface its
// signature diagonal "Schräge". Reads the clip polygon + overlay color from
// `theme.schraege` so the recipe is single-sourced.
export const Schraege: FC<SchraegeProps> = ({ variant = "default", light = false }) => {
  return (
    <Box
      data-testid="schraege"
      aria-hidden
      sx={(theme) => ({
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        backgroundColor: light ? theme.schraege.overlayLight : theme.schraege.overlay,
        clipPath: variant === "deep" ? theme.schraege.clipDeep : theme.schraege.clip,
      })}
    />
  );
};
