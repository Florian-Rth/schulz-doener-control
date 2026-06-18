import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type { FC } from "react";

type DotColor = "live" | "success";

interface LiveDotProps {
  /** `live` = bright green on red chrome; `success` = success green on login. */
  color?: DotColor;
  /** Diameter in px. */
  size?: number;
  sx?: SxProps<Theme>;
}

// Pulsing status dot (the `pulseDot` keyframe is registered once globally).
export const LiveDot: FC<LiveDotProps> = ({ color = "live", size = 8, sx }) => {
  return (
    <Box
      aria-hidden
      data-testid="live-dot"
      sx={[
        (theme) => ({
          width: size,
          height: size,
          borderRadius: "50%",
          flexShrink: 0,
          backgroundColor: color === "live" ? theme.ds.liveGreen : theme.palette.success.main,
          animation: `${theme.keyframes.pulseDot} 2s infinite`,
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
};
